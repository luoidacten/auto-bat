"""Two real browser clients on Git-tracked static Pages files, using PeerJS rooms."""
import json
import os
import sys
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]
config = {'transport': 'peer', 'peerjs': {'host': '127.0.0.1', 'port': int(os.environ['LEGACY_PEER_TEST_PORT']), 'path': '/legacy', 'secure': False},
          'iceServers': json.loads(Path(os.environ['LEGACY_PEER_TEST_ICE_FILE']).read_text())}
errors = []
checks = []


def probe(page):
    page.evaluate('''async () => {
      const {Match} = await import('./engine/runtime.mjs');
      const draw = Match.prototype.draw;
      Match.prototype.draw = function(...args) {
        window.__view = {clock:this.clock,state:this.state,fighters:this.fighters.map(f=>({x:f.x,human:f.human,brain:!!f.brain,moveDir:{...f.moveDir}}))};
        return draw.apply(this,args);
      };
    }''')


def open_page(browser):
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    context.add_init_script('window.LEGACY_ONLINE_CONFIG=' + json.dumps(config) + ';')
    context.add_init_script('''
      window.__pcs=[]; window.__sockets=[]; window.__metrics=[];
      const PC=window.RTCPeerConnection;
      window.RTCPeerConnection=class extends PC{constructor(...args){super(...args);__pcs.push(this);}};
      const Socket=window.WebSocket;
      window.WebSocket=class extends Socket{constructor(...args){super(...args);__sockets.push(this);}};
      const NativeWorker=window.Worker;
      window.Worker=class extends NativeWorker{constructor(...args){super(...args);this.addEventListener('message',e=>{
        if(e.data.type==='benchmark')__metrics.push(e.data.benchmark);
        if(e.data.type==='state')window.__hostWorker=this;
      });}};
    ''')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append({'message': message.text, 'url': message.location.get('url')}) if message.type == 'error' else None)
    page.on('response', lambda response: errors.append(f'HTTP {response.status}: {response.url}') if response.status >= 400 else None)
    page.goto(BASE + '/auto-bat/legacy/index.html', wait_until='networkidle')
    assert page.locator('#hero option').count() == 40
    probe(page)
    return context, page


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox', '--disable-dev-shm-usage'])
    ca, a = open_page(browser)
    cb, b = open_page(browser)
    a.locator('#hero').select_option('vector')
    b.locator('#hero').select_option('ariston')
    a.locator('#create-room').click()
    a.locator('#lobby').wait_for(state='visible')
    code = a.locator('#lobby-code').inner_text()
    b.locator('#room-code').fill(code)
    b.locator('#join-room').click()
    b.locator('#lobby').wait_for(state='visible')
    a.locator('#ready').click()
    b.locator('#ready').click()
    for page in [a, b]:
        page.wait_for_function('window.__view && __view.clock > .2')
        assert page.evaluate('__view.fighters.every(f=>f.human && !f.brain)')
        assert page.evaluate('__sockets.every(s=>!new URL(s.url).pathname.endsWith("/socket"))')
        channels = page.evaluate('''async () => {
          const stats=(await Promise.all(__pcs.filter(p=>p.connectionState==='connected').map(p=>p.getStats()))).flatMap(s=>[...s.values()]);
          return stats.filter(s=>s.type==='data-channel').map(s=>({label:s.label,bytes:s.bytesReceived+s.bytesSent}));
        }''')
        for label in ['legacy-control', 'legacy-state', 'legacy-room']:
            assert any(c['label'] == label and c['bytes'] > 0 for c in channels), channels
    metrics = [page.evaluate('__metrics[0]') for page in [a, b]]
    scores = [m['p95Ms'] * .8 + m['meanMs'] * .2 for m in metrics]
    host_team = int(a.locator('#peer-status').get_attribute('data-host-team'))
    assert host_team == (1 if scores[1] < scores[0] * .95 else 0)
    checks.append('two human clients join by code from a static Pages path; real PeerJS room plus native RTC gameplay; faster measured host')

    host = [a, b][host_team]
    host.evaluate('__hostWorker.postMessage({type:"forfeit",team:0,reason:"match"})')
    for page in [a, b]:
        page.locator('#result').wait_for(state='visible')
        page.locator('#play-again').click()
    for page in [a, b]:
        page.wait_for_function('__metrics.length === 2 && window.__view && __view.state === "fight" && __view.clock > .2 && document.querySelector("#result").hidden && !document.querySelector("#game-hud").hidden')
    checks.append('room rematch benchmarks both machines again')

    # Reload guest and creator, independent of which machine won host selection.
    for page in [b, a]:
        page.reload(wait_until='networkidle')
        probe(page)
        try:
            page.wait_for_function('window.__view && __view.clock > .2')
        except Exception:
            print(json.dumps({'completed': checks, 'reloading': 'guest' if page is b else 'creator', 'state': [p.evaluate('''() => {
              const stored=JSON.parse(sessionStorage.getItem('legacy_arena_peer_room') || 'null');
              return {toast:document.querySelector('#status').textContent,peer:document.querySelector('#peer-status').textContent,
                lobby:document.querySelector('#lobby-players').textContent,clock:window.__view?.clock,
                connections:__pcs.map(p=>({state:p.connectionState,ice:p.iceConnectionState})),
                room:stored?{phase:stored.phase,generation:stored.match?.generation,hostTeam:stored.match?.hostTeam,players:stored.players.map(p=>p?{online:p.online,ready:p.ready}:null)}:null};
            }''') for p in [a,b]], 'errors': errors}))
            raise
        page.wait_for_function('document.querySelector("#peer-status").dataset.state === "connected"')
    for page in [a, b]:
        page.wait_for_function('document.querySelector("#peer-status").dataset.state === "connected"')
    checks.append('both guest and creator reload and resume peer rooms with no application server')

    urllib.request.urlopen(urllib.request.Request(BASE + '/__test__/stop-broker', method='POST')).read()
    before = b.evaluate('__view.clock')
    a.bring_to_front()
    a.keyboard.down('KeyD')
    b.wait_for_function('__view.fighters[0].moveDir.x > .5')
    a.keyboard.up('KeyD')
    b.wait_for_function(f'__view.clock > {before+.5}')
    a.locator('#quit').click()
    b.locator('#result').wait_for(state='visible')
    assert b.locator('#result-title').inner_text() == 'Bạn thắng!'
    checks.append('gameplay and result still travel peer-to-peer after the PeerServer broker stops')
    assert not errors, errors
    ca.close()
    cb.close()
    browser.close()

print(json.dumps({'passed': len(checks), 'checks': checks, 'errors': errors}))
