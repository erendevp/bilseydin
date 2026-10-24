"""Anahtar yardımcıları (GitHub Actions içinde çalışır).

  python3 publish/tokens.py tiktok-code <kod>   TikTok yetki kodunu kalıcı yenileme anahtarına çevirir
  python3 publish/tokens.py ig-refresh          Instagram uzun ömürlü anahtarını yeniler (60 gün geçerli)
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from publish import http, save_secret, TT, REPO


def tiktok_code(code):
    redirect = os.environ.get('TIKTOK_REDIRECT_URI') or f"https://{REPO.split('/')[0].lower()}.github.io/{REPO.split('/')[1]}/docs/callback.html"
    st, r = http('POST', f'{TT}/v2/oauth/token/', {
        'client_key': os.environ['TIKTOK_CLIENT_KEY'], 'client_secret': os.environ['TIKTOK_CLIENT_SECRET'],
        'code': code, 'grant_type': 'authorization_code', 'redirect_uri': redirect})
    if st != 200 or 'refresh_token' not in r:
        print('HATA', st, r); sys.exit(1)
    print('İzinler:', r.get('scope'), '| open_id:', r.get('open_id'))
    save_secret('TIKTOK_REFRESH_TOKEN', r['refresh_token'])


def ig_refresh():
    st, r = http('GET', 'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token='
                 + os.environ['IG_TOKEN'])
    if st != 200 or 'access_token' not in r:
        print('HATA', st, r); sys.exit(1)
    save_secret('IG_TOKEN', r['access_token'])
    print('Yeni IG anahtarı süresi (sn):', r.get('expires_in'))


if __name__ == '__main__':
    {'tiktok-code': lambda: tiktok_code(sys.argv[2]), 'ig-refresh': ig_refresh}[sys.argv[1]]()
