# Emin Onur Tuğran — Purple Team Portfolyo

Sinematik, kaydırmayla ilerleyen kişisel portfolyo: karanlık bir odanın çizimi → renkli sahne → monitöre zoom → Kali giriş ekranı → etkileşimli Kali masaüstü (projeler, yetkinlikler, CV, iletişim).

**Teknolojiler:** Vite · React 18 · Tailwind CSS v4 · GSAP (ScrollTrigger) · Lenis

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ klasörüne derler
```

## İçeriği güncelleme

| Ne | Nerede |
| --- | --- |
| İsim, linkler, e-posta, TryHackMe rozeti | `src/components/KaliDesktop.jsx` → `P` |
| Projeler | `src/components/KaliDesktop.jsx` → `PROJECTS` (kapak çizimleri: `ProjectCover.jsx`) |
| Sekme içerikleri (Hakkımda, Yetkinlikler…) | `src/components/KaliDesktop.jsx` → `TabContent` |
| Terminal komutları | `src/components/KaliDesktop.jsx` → `TERMINALS` |
| CV (repoda yok) | PDF'i `public/cv/` içine koy, `.env.local` → `VITE_CV_FILE=cv/dosya.pdf` |
| Link önizleme görseli / adresi | `public/og-image.jpg`, `.env` → `VITE_SITE_URL` |

## GitHub Pages'te yayınlama

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. **Actions → Deploy to GitHub Pages → Run workflow** (ya da workflow'a `push` tetikleyicisi ekle).
4. Repo adı `portfolyo` değilse `.env` içindeki `VITE_SITE_URL`'i yeni adrese göre düzelt.
