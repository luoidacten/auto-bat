"""Serve only Git-tracked files at a GitHub Pages project path; no build server.

Run after npm run build and staging generated runtime files: npm run test:static.
"""
import functools
import json
import os
from pathlib import Path
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PREFIX = '/auto-bat/'
tracked = set(subprocess.check_output(
    ['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0'))
missing = []


class TrackedFiles(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript'}

    def target(self):
        path = unquote(urlsplit(self.path).path)
        if not path.startswith(PREFIX):
            return None
        relative = path[len(PREFIX):]
        if path.endswith('/'):
            relative += 'index.html'
        resolved = (ROOT / relative).resolve()
        if not resolved.is_relative_to(ROOT):
            return None
        return resolved

    def translate_path(self, path):
        return str(self.target() or ROOT / '__not_found__')

    def do_GET(self):
        target = self.target()
        if target is None or target.relative_to(ROOT).as_posix() not in tracked:
            self.send_error(404)
            return
        super().do_GET()

    def log_request(self, code='-', size='-'):
        if isinstance(code, int) and code >= 400:
            missing.append({'path': self.path, 'status': code})

    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(TrackedFiles, directory=str(ROOT)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
failures = []
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
            args=['--no-sandbox', '--disable-dev-shm-usage'])
        context = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = context.new_page()
        page.on('pageerror', lambda error: failures.append(str(error)))
        page.on('console', lambda message: failures.append(message.text) if message.type == 'error' else None)
        page.goto(f'http://127.0.0.1:{server.server_port}{PREFIX}legacy/index.html', wait_until='networkidle')
        assert page.locator('#hero option').count() == 40
        resources = page.evaluate('''async () => {
          const manifest = await fetch(document.querySelector('link[rel="manifest"]').href).then(r => r.json());
          const icon = new URL(manifest.icons[0].src, document.querySelector('link[rel="manifest"]').href);
          const favicon = document.querySelector('link[rel="icon"]').href;
          const {measureHost} = await import('./client/p2p-session.mjs');
          return {icon:(await fetch(icon)).status, favicon:(await fetch(favicon)).status, benchmark:await measureHost()};
        }''')
        assert resources['icon'] == resources['favicon'] == 200, resources
        assert resources['benchmark']['ticks'] == 512, resources
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        page.wait_for_function("document.querySelector('#offline-status').textContent.includes('Đã sẵn sàng')")
        page.locator('#offline').click()
        page.wait_for_function("document.querySelector('#clock').textContent !== ''")
        page.locator('#quit').click()
        assert page.locator('#resume-offline').is_visible()
        context.set_offline(True)
        page.reload(wait_until='networkidle')
        assert page.locator('#hero option').count() == 40
        assert page.evaluate('''async () => {
          const image = new Image();
          image.src = '../img/Free/Part 6/293.png';
          await image.decode();
          return image.naturalWidth > 0;
        }''')
        page.locator('#resume-offline').click()
        page.wait_for_function("document.querySelector('#clock').textContent !== ''")
        assert page.locator('#game-hud').is_visible()
        assert not missing, missing
        assert not failures, failures
        browser.close()
    print(json.dumps({'passed': 1, 'checks': ['Git-tracked source at /auto-bat/legacy/index.html: 40 heroes, modules, icons, host worker and offline reload with shared media'], 'errors': failures, 'missing': missing}))
finally:
    server.shutdown()
    server.server_close()
    thread.join()
