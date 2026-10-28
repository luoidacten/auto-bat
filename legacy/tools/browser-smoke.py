"""Functional desktop/touch/offline-PWA and two-player online checks.
Start npm run dev, then run python3 tools/browser-smoke.py [base-url].
"""
import json
import math
import os
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8002').rstrip('/')
failures = []
checks = []


def probe(page):
    page.evaluate('''async () => {
      const {Match} = await import('./engine/runtime.mjs');
      const original = Match.prototype.draw;
      Match.prototype.draw = function(...args) {
        window.__view = {clock:this.clock,state:this.state,fighters:this.fighters.map(f=>({id:f.id,x:f.x,y:f.y,moveDir:{...f.moveDir},percent:f.percent,human:f.human,brain:!!f.brain,cd:{...f.cd},dealt:f.stats.dealt}))};
        return original.apply(this,args);
      };
    }''')


def open_page(context):
    page = context.new_page()
    page.add_init_script("""
      window.__rtc = []; window.__signalSockets = []; window.__signalTypes = []; window.__hostMetrics = [];
      const NativePC = window.RTCPeerConnection;
      window.RTCPeerConnection = class extends NativePC { constructor(config) { super(config); window.__rtc.push(this); } };
      const NativeSocket = window.WebSocket;
      window.WebSocket = class extends NativeSocket {
        constructor(...args) { super(...args); window.__signalSockets.push(this); }
        send(data) { try { const packet=JSON.parse(data); window.__signalTypes.push(packet.type); if(packet.type==='ready') window.__hostMetrics.push(packet.benchmark); } catch {} super.send(data); }
      };
    """)
    page.on('pageerror', lambda error: failures.append(str(error)))
    page.on('console', lambda message: failures.append(message.text) if message.type == 'error' else None)
    page.goto(BASE, wait_until='networkidle')
    assert page.locator('#hero option').count() == 40
    probe(page)
    return page


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox', '--disable-dev-shm-usage'])
    desktop = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = open_page(desktop)
    page.locator('#bot-hero').select_option('ariston')
    page.locator('#offline').click()
    page.wait_for_function('window.__view && __view.clock > .1')
    assert page.evaluate('__view.fighters[0].human && !__view.fighters[0].brain && __view.fighters[1].brain')
    assert page.evaluate('__view.fighters[0].dealt') == 0
    before = page.evaluate('__view.fighters[0].x')
    page.keyboard.down('KeyD')
    page.wait_for_timeout(300)
    page.keyboard.up('KeyD')
    assert page.evaluate('__view.fighters[0].x') > before + 10
    page.keyboard.press('KeyQ')
    page.wait_for_function('__view.fighters[0].cd.A > 0')
    page.keyboard.press('Escape')
    assert page.locator('#pause').inner_text() == 'Tiếp tục'
    page.keyboard.press('Escape')
    page.locator('#quit').click()
    assert page.locator('#resume-offline').is_visible()
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    page.wait_for_function("document.querySelector('#offline-status').textContent.includes('Đã sẵn sàng')")
    desktop.set_offline(True)
    page.reload(wait_until='networkidle')
    assert page.locator('#offline').is_visible()
    assert page.locator('#hero option').count() == 40
    probe(page)
    page.locator('#resume-offline').click()
    page.wait_for_function('window.__view && __view.clock > .1')
    assert page.locator('#game-hud').is_visible()
    checks.append('desktop direct control, pause, save, offline reload and resume')
    desktop.set_offline(False)
    desktop.close()

    touch = browser.new_context(viewport={'width': 900, 'height': 420}, has_touch=True, is_mobile=True)
    page = open_page(touch)
    page.locator('#hero').select_option('boran')
    page.locator('#offline').tap()
    page.wait_for_function('window.__view && __view.clock > .2')
    assert page.locator('#stick').is_visible()
    page.locator('[data-skill="A"]').tap()
    page.wait_for_function('__view.fighters[0].cd.A > 0')
    page.screenshot(path='/tmp/legacy-player-touch.png')
    checks.append('touch hero selection, offline match and skill button')
    touch.close()

    first = browser.new_context(viewport={'width': 1366, 'height': 900})
    second = browser.new_context(viewport={'width': 1366, 'height': 900})
    a, b = open_page(first), open_page(second)
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
    for client in [a, b]:
        client.wait_for_function('window.__view && __view.clock > .2')
        assert client.evaluate('__view.fighters.every(f=>f.human && !f.brain)')
        assert not client.locator('#pause').is_visible()
    before = a.evaluate('__view.fighters[0].x')
    other = b.evaluate('__view.fighters[1].x')
    a.bring_to_front()
    a.keyboard.down('KeyD')
    a.wait_for_timeout(400)
    a.keyboard.up('KeyD')
    b.wait_for_function(f'__view.fighters[0].x > {before+10}')
    assert b.evaluate('__view.fighters[1].moveDir.x === 0 && __view.fighters[1].moveDir.y === 0'), b.evaluate('__view.fighters')
    for client in [a,b]:
        assert client.locator('#peer-status').get_attribute('data-transport') == 'webrtc'
        assert client.locator('#peer-status').get_attribute('data-state') == 'connected'
        assert client.evaluate('__hostMetrics.length === 1 && __hostMetrics[0].ticks >= 256')
        assert client.evaluate('__signalTypes.every(t => t !== "input" && t !== "snapshot")')
        rtc = client.evaluate("""async () => {
          const pc=__rtc.find(p=>p.connectionState==='connected');
          const stats=[...(await pc.getStats()).values()];
          return {connected:pc.connectionState,channels:stats.filter(s=>s.type==='data-channel').map(s=>({label:s.label,state:s.state,sent:s.bytesSent,received:s.bytesReceived}))};
        }""")
        assert rtc['connected'] == 'connected'
        assert any(c['label'] == 'legacy-control' and c['sent'] > 0 for c in rtc['channels']), rtc
        assert any(c['label'] == 'legacy-state' and c['received'] + c['sent'] > 0 for c in rtc['channels']), rtc
    host_team = int(a.locator('#peer-status').get_attribute('data-host-team'))
    metrics = [client.evaluate('__hostMetrics[0]') for client in [a,b]]
    scores = [metric['p95Ms'] * .8 + metric['meanMs'] * .2 for metric in metrics]
    assert host_team == (1 if scores[1] < scores[0] * .95 else 0), (host_team, metrics)
    host, guest = ([a,b][host_team], [a,b][1-host_team])
    guest.reload(wait_until='networkidle')
    probe(guest)
    guest.wait_for_function('window.__view && __view.clock > .2')
    guest.wait_for_function("document.querySelector('#peer-status').dataset.state === 'connected'")
    assert guest.evaluate('__view.fighters.every(f=>f.human && !f.brain)')
    host.wait_for_function("JSON.parse(sessionStorage.getItem('legacy_arena_host_checkpoint') || '{}').log?.length >= 120")
    host.reload(wait_until='networkidle')
    probe(host)
    host.wait_for_function('window.__view && __view.clock > .2')
    host.wait_for_function("document.querySelector('#peer-status').dataset.state === 'connected'")
    guest.wait_for_function("document.querySelector('#peer-status').dataset.state === 'connected'")
    # Cut signaling completely. Input and snapshots must still travel over WebRTC.
    for client in [a,b]:
        client.evaluate('__signalSockets.forEach(socket=>{socket.onclose=null;socket.close();})')
    before_clock = b.evaluate('__view.clock')
    a.bring_to_front()
    a.keyboard.down('KeyD')
    b.wait_for_function('__view.fighters[0].moveDir.x > .5')
    a.keyboard.up('KeyD')
    b.wait_for_function(f'__view.clock > {before_clock+.5}')
    a.locator('#quit').click()
    b.locator('#result').wait_for(state='visible')
    assert b.locator('#result-title').inner_text() == 'Bạn thắng!'
    checks.append('real WebRTC data channels, measured host selection, guest/host reload, signaling-free gameplay and result')
    first.close()
    second.close()

    # Render every roster member through both the local model and the network projection.
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = open_page(context)
    result = page.evaluate('''async () => {
      const {ROSTER,ArenaSession,neutralInput,hydrateView}=await import('./engine/runtime.mjs');
      const ctx=document.querySelector('#arena').getContext('2d');
      const errors=[];
      for(const hero of ROSTER){
        try{
          const s=new ArenaSession({heroes:[hero.id,'zero'],mode:'training',seed:'render-'+hero.id});
          s.match.state='fight';s.match.fighters[0].x=-65;s.match.fighters[1].x=65;
          for(let i=0;i<360;i++){
            s.match.fighters[0].rage=100;
            s.step([{...neutralInput(i),pressed:i%45===0?[['A','B','C','D','U'][Math.floor(i/45)%5]]:[]}]);
            if(i%15===0){s.match.draw(ctx,1366,900);hydrateView(JSON.parse(JSON.stringify(s.snapshot()))).draw(ctx,1366,900);}
          }
        }catch(error){errors.push(hero.id+': '+error.stack);}
      }
      return {count:ROSTER.length,errors};
    }''')
    assert result['count'] == 40
    assert not result['errors'], result['errors']
    checks.append('all 40 heroes render locally and from server projections')
    context.close()

    coach = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = coach.new_page()
    page.on('pageerror', lambda error: failures.append(str(error)))
    page.on('console', lambda message: failures.append(message.text) if message.type == 'error' else None)
    page.goto(BASE + '/coach.html', wait_until='networkidle')
    assert page.evaluate('ROSTER.length') == 26
    page.locator('button[onclick="UI.exhibition()"]').click()
    page.locator('button[onclick="UI.startExhibition()"]').click()
    page.wait_for_function('G.match && G.match.state === "fight" && G.match.clock > .2')
    assert page.locator('#match-ui').is_visible()
    checks.append('old coach mode still starts its 26-hero AI exhibition')
    coach.close()
    browser.close()

assert not failures, json.dumps(failures, ensure_ascii=False)
print(json.dumps({'passed':len(checks),'checks':checks,'errors':failures},ensure_ascii=False))
