# bilseydin.tr — otomatik video fabrikası

Köşeli 3D "son kez" videolarını **üreten** (Claude, zamanlanmış görev) ve **yayınlayan** (GitHub Actions) sistem.

```
Claude (haftada 3 kez)            GitHub (depo)                      GitHub Actions (her gün 19:00)
 ├─ konular.md'den konu seçer      episodes/NNN/scene.js              ├─ "ready" bölüm var mı?
 ├─ senaryo + 3D sahne yazar  ──▶  episodes/NNN/video.mp4  ──▶       ├─ (onay modu) sana sorar
 ├─ test kareleriyle kontrol       episodes/NNN/meta.json             ├─ Instagram Reels'e yayınlar
 ├─ 1080×1920 video + müzik        (GitHub Pages: herkese açık        ├─ TikTok'a gönderir (taslak / doğrudan)
 └─ commit + sana rapor             video adresi)                      └─ meta.json'u "published" yapar
```

## Kurulum (bir kez, ~45 dk)

### 1) GitHub
1. github.com'da hesap aç (varsa geç).
2. **Herkese açık (Public)** ve **boş** bir depo oluştur: `bilseydin`.
   (Herkese açık olması gerekiyor çünkü Instagram videoyu herkese açık bir adresten çekiyor. Anahtarlar yine gizli kalır.)
3. Depo adını Claude'a söyle; Claude dosyaları yükler.
4. Settings → **Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
5. Settings → **Environments** → New environment → `yayin`
   → *Required reviewers*: kendini ekle. (Her yayından önce telefonuna GitHub bildirimi gelir, "Approve" dersin.
   Tam otomatik istediğinde bu kutuyu kaldırman yeterli.)
6. Sağ üst profil → Settings → Developer settings → **Fine-grained tokens** → Generate:
   Repository access: sadece `bilseydin`; Permissions → **Secrets: Read and write**. Oluşan anahtarı kopyala.
7. Depo → Settings → Secrets and variables → **Actions** → New repository secret:
   - `GH_PAT` = 6. adımdaki anahtar
8. Aynı sayfada **Variables** sekmesi → New variable: `TIKTOK_MODE` = `inbox`

### 2) Instagram (Reels otomatik yayın)
1. Instagram uygulaması → Ayarlar → Hesap türü → **Profesyonel hesap (İçerik üreticisi)**'ne geç.
2. developers.facebook.com → My Apps → **Create App** → kullanım alanı: *Instagram API* (Instagram ile içerik yönetimi).
3. Uygulama içinde *API setup with Instagram login* → **Generate access tokens** → *Add account* → @bilseydin.tr ile giriş yap.
   İzinler: `instagram_business_basic`, `instagram_business_content_publish`.
4. Gösterilen **erişim anahtarını** ve hesabın **Instagram kullanıcı kimliğini (ID)** kopyala.
5. GitHub Secrets'a ekle: `IG_TOKEN`, `IG_USER_ID`.
   (Anahtar 60 gün geçerli; `anahtar-yenile.yml` ayda iki kez otomatik yeniler.)

### 3) TikTok
1. developers.tiktok.com → hesap aç → **Manage apps → Connect an app**.
2. Ürün ekle: **Login Kit** ve **Content Posting API**. Kapsamlar: `user.info.basic`, `video.upload`
   (ileride doğrudan yayın için `video.publish`).
3. Redirect URI: `https://KULLANICIADIN.github.io/bilseydin/docs/callback.html`
4. Uygulamayı **Sandbox**'ta kendi hesabını hedef kullanıcı olarak ekleyerek kullan ya da incelemeye gönder.
5. GitHub Secrets: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.
6. Telefondan/bilgisayardan şu adresi aç (KEY ve kullanıcı adını değiştir), @bilseydin.tr ile izin ver:
   ```
   https://www.tiktok.com/v2/auth/authorize/?client_key=KEY&scope=user.info.basic,video.upload&response_type=code&state=bilseydin&redirect_uri=https%3A%2F%2FKULLANICIADIN.github.io%2Fbilseydin%2Fdocs%2Fcallback.html
   ```
7. Açılan sayfadaki kodu kopyala → GitHub → Actions → **TikTok hesabını bağla (bir kez)** → Run workflow → kodu yapıştır.

> **TikTok sınırı:** TikTok, incelemeden (audit) geçmemiş uygulamaların doğrudan paylaşımlarını sadece "gizli" yapıyor.
> Bu yüzden varsayılan mod `inbox`: video TikTok uygulamana **taslak bildirimi** olarak gelir, sen tek dokunuşla paylaşırsın.
> Uygulaman incelemeden geçerse `TIKTOK_MODE` = `direct` yap ve kapsamlara `video.publish` ekleyip 6–7. adımları tekrarla.

## Günlük kullanım
- Yeni konu fikri: `konular.md` sonuna `- [sırada] ...` ekle (GitHub sitesinden düzenlenebilir).
- Belirli bir bölümü hemen yayınla: Actions → Yayınla → Run workflow → bölüm adı.
- Yayın saatini değiştir: `.github/workflows/yayinla.yml` içindeki `cron` (UTC; 16:00 UTC = 19:00 TR).
- Yayını duraklat: Actions → Yayınla → ••• → Disable workflow.

## Klasörler
- `engine/` three.js + fontlar · `render.html` ortak sahne sayfası
- `episodes/NNN-ad/` bölüm: `scene.js` (sahneler, yazılar), `meta.json` (açıklama, etiketler, durum), `video.mp4`
- `tools/` render (`render.py`), müzik (`music.py`), tek komutla üretim (`build.sh`)
- `publish/` Instagram & TikTok gönderimi, anahtar yenileme
- `CLAUDE.md` Claude'un her çalışmada izlediği kılavuz · `konular.md` konu sırası
