# bilseydin.tr — Claude çalışma kılavuzu

Bu depo, **@bilseydin.tr** (Instagram + TikTok) hesabı için kısa, duygusal, köşeli 3D "son kez" videolarını üretir.
Zamanlanmış her Claude çalışması **bir yeni bölüm** üretir, kontrol eder ve yayın sırasına koyar.
Yayınlama işini Claude değil, GitHub Actions (`.github/workflows/yayinla.yml`) her gün 19:00'da yapar.

## Her çalışmada yapılacaklar (sırayla)

1. **Durum kontrolü**
   - `gh run list --workflow yayinla.yml -L 5` ile son yayın çalışmalarına bak. Hata varsa `gh run view <id> --log-failed`
     ile nedenini oku ve kullanıcıya bildirilecekler listesine ekle (anahtar süresi dolmuş, video adresi açılmıyor vb.).
   - `episodes/*/meta.json` içinde `status: "ready"` olan **2 veya daha fazla** bölüm varsa yeni bölüm üretme;
     sadece raporla ve çık (yayın sırası doluyken birikme yapma).

2. **Konu seç**: `konular.md` içindeki ilk `[sırada]` satırı. Klasör adı: `episodes/NNN-kisa-ad` (NNN bir sonraki numara).

3. **Senaryo** (Türkçe, 75–95 sn):
   - Açılış başlığı ilk 3,5 sn ekranda: bölüme özel bir soru ("Ya son kez olduğunu bilseydin?" ana çizgi; varyasyon serbest).
   - 6–8 sahne. Her sahnede yıl/yer notu ve bir sayaç olur. Sayaç biçimi konuya göre seçilir:
     001'deki `YAŞIN` + `KALAN …: 1 → 0`, 002'deki `KALAN ZİYARET` geri sayımı, ya da 003'teki
     `YAŞIN` → `GÖRÜŞMEDİĞİNİZ GÜN` (sonda 0'a düşer). Değişen sayılar turuncu parlar.
   - Telefon mesajı sahnesi gerekiyorsa 003'teki `makeChat` kartını kullan (emoji kullanma; font desteklemiyor).
   - Her sahnede 1–2 alt yazı; en fazla 2 satır, satır başına ~32 karakter. Sade, içten, klişe kaçmayan cümleler.
     Okuma süresi: her alt yazı en az 3,5 sn ekranda.
   - Son sahne umutlu bir eylemle biter ("Git, bir tane daha yaşa." çizgisinde, her bölümde farklı söyleyiş).
   - Kapanış kartı: başlık sorusu + iki küçük satır (2. satır bir etiketleme/eylem çağrısı).
   - Türkiye'ye özgü, evrensel anılar. **Yasak**: gerçek kişiler, markalar/logolar, siyasi semboller, dini değerleri
     küçümseme, şiddet, ölümün açıkça gösterilmesi (yokluk sadece boş sandalye/boş sofra gibi imalarla anlatılır).

4. **Sahne kodu**: konuya en yakın bölümün `scene.js` dosyasını yeni klasöre kopyala ve değiştir
   (001: aile/son kezler, 002: verandalı ev `H` seti + salıncak, 003: mahalle sokağı + iki mesaj kartı).
   Dikey (9:16) kadraj dardır: iki karakter aynı karede olacaksa kamerayı aralarındaki çizgiye dik değil, onlarla aynı hizaya koy.
   - Hazır setler: `A` apartman + balkon + avlu, `B` dede evi + verandalı + çardak altında kahvaltı masası,
     `C` mahalle sokağı (akşam), `E` otogar. Yeni set gerekiyorsa aynı `box()` diliyle ekle (düz renk, köşeli, sade).
   - Hazır karakterler `C('ad', {...})` ile; aynı kişinin farklı yaşları için ayrı karakter tanımla. Kahraman: mavi tişört.
   - Işık önayarları: `morning, bayram, dusk, overcast, golden, otogar`.
   - Hareket yardımcıları: `walkPath`, `pose` (sit, straddle, bow, armLx/armRx…), `cam` anahtar kareleri.
   - `EPTEXT`, `SUBS`, `COUNTER`, `SC` (sahne zamanları) ve `window.DURATION` güncellenmeli.

5. **Test kareleri ve görsel kontrol** (atlanmaz):
   ```bash
   python3 tools/render.py episodes/NNN-ad test 1,3,6,...  /tmp/kontrol
   ```
   Her sahneden en az 2 kare al, kontak tabakası yap (`ffmpeg ... tile`), **Read ile bak**. Kontrol listesi:
   - Karakterler kadrajda ve görünür mü? Ön planda direk/ağaç/sandalye konuyu kapatıyor mu?
   - Kamera karakterlere arkadan mı bakıyor? (Duygusal anlarda yüz/yan profil görünmeli.)
   - Alt yazı yüzün üstüne biniyor mu, taşma var mı, Türkçe karakterler doğru mu?
   - Sayaç doğru anda 0'a düşüyor mu? Yıl/yer notları ve yaşlar tutarlı mı (kahraman 1991 doğumlu)?
   Sorun varsa düzelt ve tekrar test et. En fazla 4 düzeltme turu.

6. **Tam üretim**: `tools/build.sh episodes/NNN-ad` (≈35 dk). Sonra `episodes/NNN-ad/kontrol.jpg` dosyasına bak.

7. **meta.json** yaz:
   ```json
   {"title": "...", "caption": "2–4 satır, son satır eylem çağrısı", "hashtags": ["sonkez","bilseydin","nostalji", "..."],
    "duration": 88, "cover_ms": 2500, "status": "ready", "publish": {}}
   ```
   En fazla 10 etiket. Açıklama Türkçe, emoji en fazla 1–2.

8. `konular.md` içinde satırı `[hazır NNN]` yap. `git add -A && git commit -m "bölüm NNN: ..." && git push`.

9. **Rapor**: kullanıcıya kısa Türkçe özet gönder: bölüm adı, süre, yayın tarihi (bir sonraki 19:00), varsa
   önceki yayınların sonucu ve yapması gereken bir şey (ör. "GitHub'da yayını onayla", "TikTok'ta taslağı paylaş").

## Teknik notlar
- Render, Chromium + SwiftShader ile yapılır (`tools/render.py`). Kare başı ~0,75 sn.
- Müzik `tools/music.py` ile üretilir (telifsiz piyano). Her bölümde farklı tohum kullan; ton `am|em|dm`.
- Video dosyası ~25 MB; depoya eklenir ve GitHub Pages üzerinden Instagram'a herkese açık adresle verilir.
- Yayınlanmış bölümlerin `video.mp4` dosyaları 30 gün sonra silinebilir (depo boyutu için); meta.json kalır.
- Anahtarlar/gizli bilgiler asla depoya, koda veya sohbete yazılmaz; hepsi GitHub Secrets'tadır.
