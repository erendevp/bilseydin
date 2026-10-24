"""Bölüm render aracı.

Kullanım:
  python3 tools/render.py <bolum-klasoru> test 2,6,9.5 <cikti-klasoru>   # tek tek test kareleri (PNG)
  python3 tools/render.py <bolum-klasoru> full <cikti.mp4>               # tüm video (sessiz)
  python3 tools/render.py <bolum-klasoru> avatar <kod.js> <cikti.png>    # kare görsel (profil vb.)

Bölümün süresi scene.js içindeki window.DURATION değerinden okunur.
Çıktı 1080x1920 (9:16), 30 fps. Ortam değişkeni DSF ile ölçek değişir (varsayılan 1.5).
"""
import sys, os, threading, http.server, functools, subprocess, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EP = os.path.basename(os.path.normpath(sys.argv[1]))
MODE = sys.argv[2]
DSF = float(os.environ.get('DSF', '1.5'))
PORT = int(os.environ.get('PORT', '8765'))

Handler = type('H', (http.server.SimpleHTTPRequestHandler,), {'log_message': lambda *a: None})
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Handler, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()

ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    vw, vh = (800, 800) if MODE == 'avatar' else (720, 1280)
    dsf = 1.35 if MODE == 'avatar' else DSF
    pg = b.new_page(viewport={'width': vw, 'height': vh}, device_scale_factor=dsf)
    logs = []
    pg.on('console', lambda m: logs.append(m.text))
    pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
    pg.goto(f'http://127.0.0.1:{PORT}/render.html?ep={EP}')
    try:
        pg.wait_for_function('window.READY===true || window.LOADERR', timeout=90000)
    except Exception:
        pass
    err = pg.evaluate('window.LOADERR || null')
    if err or any(l.startswith('PAGEERROR') for l in logs):
        print('HATA:', err, '\n'.join(logs[-15:]))
        sys.exit(2)
    pg.evaluate("Promise.all([document.fonts.load('29px LoraI'),document.fonts.load('36px Lora'),"
                "document.fonts.load('600 15px Inter'),document.fonts.load('500 12px Inter')])")
    dur = pg.evaluate('window.DURATION')
    if MODE == 'test':
        ts = [float(x) for x in sys.argv[3].split(',')]
        out = sys.argv[4]; os.makedirs(out, exist_ok=True)
        for t in ts:
            pg.evaluate(f'renderAt({t})')
            pg.screenshot(path=f'{out}/f_{t:06.2f}.png')
        print('test kareleri:', out)
    elif MODE == 'avatar':
        code = open(sys.argv[3]).read()
        pg.evaluate(f'avatar({code})')
        pg.screenshot(path=sys.argv[4], clip={'x': 0, 'y': 0, 'width': 800, 'height': 800})
    else:
        out = sys.argv[3]; fps = 30
        W, H = int(720 * DSF), int(1280 * DSF)
        ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'png', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-vf', f'scale={W}:{H}', out],
                              stdin=subprocess.PIPE)
        n = int(dur * fps); t0 = time.time()
        for i in range(n):
            pg.evaluate(f'renderAt({i / fps})')
            ff.stdin.write(pg.screenshot(type='png'))
            if i % 300 == 0:
                print(f'kare {i}/{n}  {time.time() - t0:.0f} sn', flush=True)
        ff.stdin.close(); ff.wait()
        print('bitti', out, flush=True)
    late = [l for l in logs if l.startswith('PAGEERROR')]
    if late:
        print('UYARI sayfa hataları:', late[:5])
    b.close()
srv.shutdown()
