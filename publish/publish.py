"""Sıradaki hazır bölümü Instagram (Reels) ve TikTok'a gönderir. GitHub Actions içinde çalışır.

Gerekli gizli değişkenler (GitHub > Settings > Secrets and variables > Actions):
  IG_USER_ID, IG_TOKEN                          Instagram (Instagram Login API)
  TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET,
  TIKTOK_REFRESH_TOKEN                          TikTok Content Posting API
  GH_PAT                                        yenilenen TikTok anahtarını geri kaydetmek için
Ayarlar (Variables):
  TIKTOK_MODE   inbox (varsayılan: taslak olarak gelen kutusuna) | direct (denetimli uygulama gerekir)
  PLATFORMS     "instagram,tiktok" (varsayılan)
  IG_API_VERSION örn. v23.0 (boşsa sürümsüz uç kullanılır)

Bölüm seçimi: episodes/*/meta.json içinde status == "ready" olan, adı en küçük klasör.
Başarıyla gönderilen platform meta.json'a yazılır; iki platform da tamamsa status = "published".
"""
import os, sys, json, time, glob, subprocess
import urllib.request, urllib.parse, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.environ.get('GITHUB_REPOSITORY', '')          # sahip/depo
OWNER, NAME = (REPO.split('/') + [''])[:2]
PLATFORMS = [p.strip() for p in os.environ.get('PLATFORMS', 'instagram,tiktok').split(',') if p.strip()]
FORCE_EP = os.environ.get('EPISODE', '').strip()


def log(*a):
    print(*a, flush=True)


def http(method, url, data=None, headers=None, raw=None, timeout=120):
    h = dict(headers or {})
    body = None
    if raw is not None:
        body = raw
    elif data is not None:
        if h.get('Content-Type', '').startswith('application/json'):
            body = json.dumps(data).encode()
        else:
            body = urllib.parse.urlencode(data).encode()
            h.setdefault('Content-Type', 'application/x-www-form-urlencoded')
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            txt = r.read().decode() or '{}'
            return r.status, json.loads(txt) if txt.strip().startswith(('{', '[')) else {'raw': txt}
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, {'raw': txt}


def pick_episode():
    eps = sorted(glob.glob(os.path.join(ROOT, 'episodes', '*', 'meta.json')))
    for m in eps:
        meta = json.load(open(m))
        ep = os.path.basename(os.path.dirname(m))
        if FORCE_EP and ep != FORCE_EP:
            continue
        if meta.get('status') == 'ready' or (FORCE_EP and meta.get('status') != 'published'):
            return ep, m, meta
    return None, None, None


def caption_of(meta):
    tags = ' '.join('#' + t.lstrip('#') for t in meta.get('hashtags', []))
    return (meta.get('caption', '').strip() + '\n\n' + tags).strip()


# ---------------- Instagram ----------------
def instagram(ep, meta):
    uid, tok = os.environ['IG_USER_ID'], os.environ['IG_TOKEN']
    ver = os.environ.get('IG_API_VERSION', '').strip()
    base = 'https://graph.instagram.com' + (f'/{ver}' if ver else '')
    video_url = f'https://{OWNER.lower()}.github.io/{NAME}/episodes/{ep}/video.mp4'
    log('IG video adresi:', video_url)
    # adresin yayında olduğundan emin ol (GitHub Pages)
    for _ in range(20):
        try:
            with urllib.request.urlopen(urllib.request.Request(video_url, method='HEAD'), timeout=30) as r:
                if r.status == 200:
                    break
        except Exception as e:
            log('video henüz yayında değil, bekleniyor…', e)
        time.sleep(30)
    st, r = http('POST', f'{base}/{uid}/media', {
        'media_type': 'REELS', 'video_url': video_url, 'caption': caption_of(meta),
        'share_to_feed': 'true', 'access_token': tok})
    if st != 200 or 'id' not in r:
        raise RuntimeError(f'IG konteyner hatası {st}: {r}')
    cid = r['id']; log('IG konteyner:', cid)
    for i in range(30):
        time.sleep(20)
        st, s = http('GET', f'{base}/{cid}?fields=status_code,status&access_token={tok}')
        code = s.get('status_code'); log('IG durum:', code, s.get('status', ''))
        if code == 'FINISHED':
            break
        if code in ('ERROR', 'EXPIRED'):
            raise RuntimeError(f'IG işleme hatası: {s}')
    else:
        raise RuntimeError('IG işleme zaman aşımı')
    st, r = http('POST', f'{base}/{uid}/media_publish', {'creation_id': cid, 'access_token': tok})
    if st != 200 or 'id' not in r:
        raise RuntimeError(f'IG yayın hatası {st}: {r}')
    log('IG yayınlandı, medya id:', r['id'])
    return {'media_id': r['id'], 'time': int(time.time())}


# ---------------- TikTok ----------------
TT = 'https://open.tiktokapis.com'


def save_secret(name, value):
    pat = os.environ.get('GH_PAT')
    if not pat:
        log(f'UYARI: GH_PAT yok, {name} güncellenemedi')
        return
    subprocess.run(['gh', 'secret', 'set', name, '--repo', REPO, '--body', value], check=True,
                   env={**os.environ, 'GH_TOKEN': pat}, capture_output=True)
    log(f'{name} güncellendi')


def tiktok_token():
    st, r = http('POST', f'{TT}/v2/oauth/token/', {
        'client_key': os.environ['TIKTOK_CLIENT_KEY'], 'client_secret': os.environ['TIKTOK_CLIENT_SECRET'],
        'grant_type': 'refresh_token', 'refresh_token': os.environ['TIKTOK_REFRESH_TOKEN']})
    if st != 200 or 'access_token' not in r:
        raise RuntimeError(f'TikTok anahtar yenileme hatası {st}: {r}')
    if r.get('refresh_token') and r['refresh_token'] != os.environ['TIKTOK_REFRESH_TOKEN']:
        save_secret('TIKTOK_REFRESH_TOKEN', r['refresh_token'])
    return r['access_token']


def tiktok(ep, meta):
    tok = tiktok_token()
    H = {'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json; charset=UTF-8'}
    path = os.path.join(ROOT, 'episodes', ep, 'video.mp4'); size = os.path.getsize(path)
    src = {'source': 'FILE_UPLOAD', 'video_size': size, 'chunk_size': size, 'total_chunk_count': 1}
    mode = os.environ.get('TIKTOK_MODE', 'inbox').strip() or 'inbox'
    if mode == 'direct':
        st, info = http('POST', f'{TT}/v2/post/publish/creator_info/query/', {}, H)
        opts = info.get('data', {}).get('privacy_level_options', [])
        privacy = 'PUBLIC_TO_EVERYONE' if 'PUBLIC_TO_EVERYONE' in opts else (opts[0] if opts else 'SELF_ONLY')
        body = {'post_info': {'title': caption_of(meta)[:2100], 'privacy_level': privacy,
                              'disable_comment': False, 'disable_duet': False, 'disable_stitch': False,
                              'video_cover_timestamp_ms': int(meta.get('cover_ms', 3000)), 'is_aigc': True},
                'source_info': src}
        url = f'{TT}/v2/post/publish/video/init/'
    else:
        body = {'source_info': src}
        url = f'{TT}/v2/post/publish/inbox/video/init/'
    st, r = http('POST', url, body, H)
    d = r.get('data', {})
    if st != 200 or not d.get('upload_url'):
        raise RuntimeError(f'TikTok başlatma hatası {st}: {r}')
    pid = d['publish_id']; log('TikTok publish_id:', pid, 'mod:', mode)
    with open(path, 'rb') as f:
        blob = f.read()
    st, r = http('PUT', d['upload_url'], raw=blob, headers={
        'Content-Type': 'video/mp4', 'Content-Length': str(size), 'Content-Range': f'bytes 0-{size - 1}/{size}'}, timeout=600)
    if st not in (200, 201):
        raise RuntimeError(f'TikTok yükleme hatası {st}: {r}')
    final = None
    for i in range(30):
        time.sleep(15)
        st, s = http('POST', f'{TT}/v2/post/publish/status/fetch/', {'publish_id': pid}, H)
        final = s.get('data', {}).get('status'); log('TikTok durum:', final)
        if final in ('SEND_TO_USER_INBOX', 'PUBLISH_COMPLETE'):
            break
        if final == 'FAILED':
            raise RuntimeError(f'TikTok işleme hatası: {s}')
    return {'publish_id': pid, 'mode': mode, 'status': final, 'time': int(time.time())}


def main():
    ep, mpath, meta = pick_episode()
    if not ep:
        log('Yayınlanacak hazır bölüm yok.')
        return 0
    log('Bölüm:', ep, '-', meta.get('title'))
    meta.setdefault('publish', {})
    errors = []
    for plat, fn in (('instagram', instagram), ('tiktok', tiktok)):
        if plat not in PLATFORMS or meta['publish'].get(plat):
            continue
        try:
            meta['publish'][plat] = fn(ep, meta)
        except Exception as e:
            errors.append(f'{plat}: {e}'); log('HATA', plat, e)
    if all(meta['publish'].get(p) for p in PLATFORMS):
        meta['status'] = 'published'
    json.dump(meta, open(mpath, 'w'), ensure_ascii=False, indent=2)
    summ = os.environ.get('GITHUB_STEP_SUMMARY')
    if summ:
        with open(summ, 'a') as f:
            f.write(f"### {ep}\n\nDurum: **{meta['status']}**\n\n```json\n{json.dumps(meta['publish'], ensure_ascii=False, indent=2)}\n```\n")
            for e in errors:
                f.write(f'- ❌ {e}\n')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
