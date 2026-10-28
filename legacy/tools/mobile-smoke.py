"""Real touch gestures: aim previews, manual drag, cancel, dual touch and P2P input."""
import json
import math
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]
errors = []
checks = []


def probe(page):
    page.evaluate('''async () => {
      const {Match} = await import('./engine/runtime.mjs');
      const {PlayerInput} = await import('./client/input.mjs');
      const draw=Match.prototype.draw, frame=PlayerInput.prototype.frame;
      window.__frames=[];
      PlayerInput.prototype.frame=function(){ const f=frame.call(this);window.__input=f;__frames.push(f);if(__frames.length>600)__frames.shift();return f;};
      Match.prototype.draw=function(...args){
        window.__view={clock:this.clock,zoom:this.zoom,fighters:this.fighters.map(f=>({id:f.id,x:f.x,y:f.y,facing:f.facing,human:f.human,brain:!!f.brain,cd:{...f.cd},controlTarget:f.controlTarget}))};
        return draw.apply(this,args);
      };
    }''')


def open_page(browser, width=900, height=420, touch=True):
    context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=touch, is_mobile=touch)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.goto(BASE, wait_until='networkidle')
    probe(page)
    return context, page


def center(page, selector):
    r = page.locator(selector).bounding_box()
    return {'x': r['x'] + r['width'] / 2, 'y': r['y'] + r['height'] / 2}


def point(p, ident=1):
    return {**p, 'id': ident}


def touch(cdp, kind, points):
    cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox', '--disable-dev-shm-usage'])
    context, page = open_page(browser)
    page.locator('#hero').select_option('boran')
    page.locator('#offline').tap()
    page.wait_for_function('window.__view && __view.clock > .2')
    cdp = context.new_cdp_session(page)
    a = center(page, '[data-skill="A"]')
    stick = center(page, '#stick')
    joy = {'x': stick['x'] + 18, 'y': stick['y'] - 18}
    touch(cdp, 'touchStart', [point(a)])
    page.locator('#aim-hint').wait_for(state='visible')
    assert page.locator('#aim-hint').get_attribute('data-shape') == 'cone'
    page.wait_for_function('__input.targetId === __view.fighters[1].id')
    assert page.evaluate('__view.fighters[0].cd.A') == 0, 'preview must not fire a regular skill'
    touch(cdp, 'touchStart', [point(a), point(joy, 2)])
    page.wait_for_function('__input.x > .4 && __input.y < -.4 && __input.held.includes("A") && !__input.pressed.includes("A")')
    page.screenshot(path='/tmp/legacy-mobile-target-aim.png')
    drag = {'x': a['x'], 'y': a['y'] - 100}
    touch(cdp, 'touchMove', [point(drag), point(joy, 2)])
    page.wait_for_function('Math.abs(__input.aim + Math.PI/2) < .08 && __input.targetId === null')
    page.screenshot(path='/tmp/legacy-mobile-manual-aim.png')
    touch(cdp, 'touchEnd', [])
    page.wait_for_function('__view.fighters[0].cd.A > 0')
    assert page.evaluate('__frames.some(f=>f.pressed.includes("A") && Math.abs(f.aim + Math.PI/2)<.08 && f.targetId===null)')
    assert page.locator('#aim-hint').is_hidden()
    b = center(page, '[data-skill="B"]')
    before = page.evaluate('__frames.length')
    touch(cdp, 'touchStart', [point(b)])
    cancel = center(page, '#cancel-skill')
    touch(cdp, 'touchMove', [point(cancel)])
    page.wait_for_function('document.querySelector("#aim-hint").dataset.cancelled === "true"')
    touch(cdp, 'touchEnd', [])
    page.wait_for_timeout(150)
    assert page.evaluate('__view.fighters[0].cd.B') == 0
    assert not page.evaluate(f'__frames.slice({before}).some(f=>f.pressed.includes("B"))')
    page.locator('#target-lock').tap()
    page.wait_for_function('__input.targetId === __view.fighters[1].id')
    page.wait_for_function('Math.abs(Math.atan2(Math.sin(__view.fighters[0].facing-Math.atan2(__view.fighters[1].y-__view.fighters[0].y,__view.fighters[1].x-__view.fighters[0].x)),Math.cos(__view.fighters[0].facing-Math.atan2(__view.fighters[1].y-__view.fighters[0].y,__view.fighters[1].x-__view.fighters[0].x))))<.15')
    page.locator('#target-lock').tap()
    page.wait_for_function('document.querySelector("#target-lock").getAttribute("aria-pressed") === "false"')
    target_point = page.evaluate('''() => ({x:innerWidth/2+__view.fighters[1].x*__view.zoom,y:innerHeight/2-40*.27+10+__view.fighters[1].y*__view.zoom})''')
    page.touchscreen.tap(target_point['x'], target_point['y'])
    page.wait_for_function('__input.targetId === __view.fighters[1].id')
    assert page.locator('#target-lock').get_attribute('aria-pressed') == 'true'
    checks.append('landscape: hold previews without firing, move and aim with two fingers, manual angle wins, release casts, cancel does not cast, look at target')
    context.close()

    portrait, page = open_page(browser, 390, 844)
    page.locator('#hero').select_option('valerius')
    page.locator('#offline').tap()
    page.wait_for_function('window.__view && __view.clock > .2')
    cdp = portrait.new_cdp_session(page)
    b = center(page, '[data-skill="B"]')
    touch(cdp, 'touchStart', [point(b)])
    page.locator('#aim-hint').wait_for(state='visible')
    assert page.locator('#aim-hint').get_attribute('data-shape') == 'line'
    for selector in ['#stick', '#skill-bar', '#target-lock']:
        box = page.locator(selector).bounding_box()
        assert box['x'] >= 0 and box['y'] >= 0 and box['x'] + box['width'] <= 391 and box['y'] + box['height'] <= 845, (selector, box)
    page.screenshot(path='/tmp/legacy-mobile-portrait-aim.png')
    touch(cdp, 'touchCancel', [])
    page.wait_for_timeout(100)
    assert page.evaluate('__view.fighters[0].cd.B') == 0
    assert page.locator('#aim-hint').is_hidden()
    checks.append('portrait: line preview and reachable controls; OS touch cancellation never casts')
    portrait.close()

    phone, a = open_page(browser)
    desktop, b = open_page(browser, 1366, 900, False)
    a.locator('#hero').select_option('boran')
    a.locator('#create-room').tap()
    a.locator('#lobby').wait_for(state='visible')
    b.locator('#room-code').fill(a.locator('#lobby-code').inner_text())
    b.locator('#join-room').click()
    b.locator('#lobby').wait_for(state='visible')
    a.locator('#ready').tap()
    b.locator('#ready').click()
    for page in [a, b]:
        page.wait_for_function('window.__view && __view.clock > .2')
        assert page.evaluate('__view.fighters.every(f=>f.human && !f.brain)')
    cdp = phone.new_cdp_session(a)
    button = center(a, '[data-skill="A"]')
    touch(cdp, 'touchStart', [point(button)])
    a.locator('#aim-hint').wait_for(state='visible')
    assert a.locator('#aim-hint').get_attribute('data-shape') == 'cone'
    b.wait_for_function('__view.fighters[0].controlTarget === __view.fighters[1].id')
    touch(cdp, 'touchMove', [point({'x': button['x'], 'y': button['y'] - 100})])
    touch(cdp, 'touchEnd', [])
    b.wait_for_function('__view.fighters[0].cd.A > 0 && __view.fighters[0].controlTarget === null && Math.abs(__view.fighters[0].facing + Math.PI/2) < .1')
    checks.append('online phone: snapshot range preview, selected target and manual release angle reach the authoritative peer; both fighters remain human')
    phone.close()
    desktop.close()
    browser.close()

assert not errors, errors
print(json.dumps({'passed': len(checks), 'checks': checks, 'errors': errors}))
