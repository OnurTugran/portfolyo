import { forwardRef, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ProjectCover from './ProjectCover.jsx';
import AmbientWallpaper from './AmbientWallpaper.jsx';
import SocWaveform from './SocWaveform.jsx';
import CyberTopology from './CyberTopology.jsx';
import CyberHud from './CyberHud.jsx';
import {
  isSfxEnabled,
  playAlertBlip,
  playKeyClick,
  playLoginSuccess,
  playStaticTick,
  playUiChime,
  subscribeSfx,
  toggleSfx,
} from '../sfx.js';

const THEMES = [
  { id: 'purple', label: 'Purple Team', accent: '#a78bfa', accent2: '#5ee6ff', accentRgb: '167, 139, 250', wallFilter: 'none' },
  { id: 'red', label: 'Red Team', accent: '#ff5c8a', accent2: '#fbbf24', accentRgb: '255, 92, 138', wallFilter: 'hue-rotate(105deg) saturate(1.22)' },
  { id: 'blue', label: 'Blue Team', accent: '#60a5fa', accent2: '#5ee6ff', accentRgb: '96, 165, 250', wallFilter: 'hue-rotate(-22deg) saturate(1.15)' },
  { id: 'matrix', label: 'Matrix CRT', accent: '#4ade80', accent2: '#6effbe', accentRgb: '74, 222, 128', wallFilter: 'hue-rotate(-95deg) saturate(1.2)' },
];

// ─── İçerik (GitHub profili + CV'den) — bilgiler değişince sadece burayı güncelle ───
export const P = {
  user: 'onur',
  host: 'kali',
  name: 'Emin Onur Tuğran',
  domain: 'onurtugran.local',
  github: 'https://github.com/OnurTugran',
  linkedin: 'https://www.linkedin.com/in/onur-tu%C4%9Fran/',
  tryhackme: 'https://tryhackme.com/p/DiSSgusted',
  // Canlı TryHackMe rozeti için: tryhackme.com → profil → "Badges" → public profile rozetinin
  // iframe kodundaki userPublicId=… sayısını buraya yaz. Boşsa rozet yerine profil kartı gösterilir.
  thmPublicId: '',
  hackthebox: 'https://profile.hackthebox.com/profile/019c7a26-1d1c-7311-a270-86b7403c5956',
  email: 'onur.tugran034@gmail.com',
  // CV repoda tutulmuyor (kişisel bilgi). .env.local içinde VITE_CV_FILE=cv/… varsa CV sekmesi/bağlantıları görünür.
  cv: import.meta.env.VITE_CV_FILE ? `${import.meta.env.BASE_URL}${import.meta.env.VITE_CV_FILE}` : null,
};

const TABS = [
  { id: 'hakkimda', label: 'Hakkımda' },
  { id: 'projeler', label: 'Projeler' },
  { id: 'yetkinlikler', label: 'Yetkinlikler' },
  { id: 'cv', label: 'CV' },
  { id: 'iletisim', label: 'İletişim' },
].filter((t) => t.id !== 'cv' || P.cv);

// GitHub'daki öne çıkan depolar (açıklamalar depo açıklamalarından).
const REPO = (name) => `${P.github}/${name}`;
const PROJECTS = [
  {
    name: 'SSRF-Ghost',
    side: 'red',
    text: 'WAF/filtre atlatma teknikleriyle SSRF zafiyeti tespiti yapan çok kanallı Python aracı.',
    tags: ['Python', 'Web güvenliği', 'SSRF'],
    problem: 'Modern uygulamalardaki URL doğrulamaları ve WAF kuralları, alternatif IP kodlamaları veya yönlendirme zincirleriyle aşılabiliyor.',
    redAngle: 'IPv6/octal/hex adresleme, HTTP yönlendirme ve farklı port/protokol payloadları ile iç ağ erişim vektörlerini tarar.',
    blueAngle: 'Çıkış (egress) trafiği ve metadata servisi (169.254.169.254) istekleri için sıkı allowlist ve WAF kuralı ihtiyacını doğrular.',
    demoCmd: 'ssrf-ghost --demo',
  },
  {
    name: 'google-dork-auditor',
    side: 'purple',
    text: 'Google dork sorgularıyla hassas veri sızıntılarını tespit eden GUI/CLI OSINT denetim aracı.',
    tags: ['Python', 'OSINT', 'GUI/CLI'],
    problem: 'Arama motorları tarafından indekslenmiş unutulmuş .env, yedek veya yapılandırma dosyaları dışarıya kritik bilgi sızdırabilir.',
    redAngle: 'Hedef alan adı üzerinde hedefli dork operatörleriyle açık indeksleri, sızan anahtarları ve panel uç noktalarını haritalar.',
    blueAngle: 'Saldırgan gözüyle pasif yüzey taraması yaparak kurumun dışarıya sızan dosyalarını olay gerçekleşmeden temizlemesini sağlar.',
    demoCmd: 'dork-audit',
  },
  {
    name: 'Stealth-TCP-SYN-Scanner',
    side: 'red',
    text: 'Scapy tabanlı, SYN paketleriyle çalışan gizli (stealth) port tarayıcı.',
    tags: ['Python', 'Scapy', 'Ağ keşfi'],
    problem: 'Tam TCP el sıkışması (connect scan) yapan taramalar hem yavaş kalır hem de uygulama katmanı loglarında doğrudan iz bırakır.',
    redAngle: 'Ham paket (raw socket) ile yalnızca SYN gönderip SYN/ACK yanıtını yakalar, bağlantıyı tamamlamadan RST ile kapatır.',
    blueAngle: 'Yarım açık (half-open) bağlantı patlamalarını IDS/SIEM üzerinde eşik ve zaman penceresi korelasyonuyla yakalamak için test üretir.',
    demoCmd: 'syn-scan 10.0.13.37',
  },
  {
    name: 'BHP-Net-Tool',
    side: 'red',
    text: 'Socket programlama ve threading üzerine kurulu, eğitim amaçlı Netcat klonu.',
    tags: ['Python', 'Socket', 'Threading'],
    problem: 'Hazır ağ araçlarının bulunmadığı izole laboratuvarlarda temel TCP dinleme, dosya aktarımı ve komut kabuğu mekanizmasını anlamak.',
    redAngle: 'Çoklu istemci bağlantısını thread havuzuyla yöneten hafif TCP istemci/sunucu ve etkileşimli kabuk mimarisi sunar.',
    blueAngle: 'Standart dışı portlarda sürekli açık kalan outbound TCP oturumlarını ve soket anomalilerini incelemek için baz trafik üretir.',
    demoCmd: 'bhp-net',
  },
  {
    name: 'Log-Analayzer',
    side: 'blue',
    text: 'Windows sistem loglarını Isolation Forest ile analiz eden anomali tespit aracı.',
    tags: ['Python', 'Isolation Forest', 'Log analizi'],
    problem: 'Statik imza kuralları, bilinen saldırı kalıplarının dışına çıkan yeni veya düşük gürültülü yetki/oturum anomalilerini kaçırabilir.',
    redAngle: 'Sıra dışı saatlerdeki oturum açma, beklenmedik süreç zincirleri ve nadir olay frekanslarını davranışsal özelliklere dönüştürür.',
    blueAngle: 'Gözetimsiz makine öğrenmesi (Isolation Forest) ile yüksek hacimli Windows event kayıtlarından aykırı olayları önceliklendirir.',
    demoCmd: 'log-analyzer --sample',
  },
  {
    name: 'omniverse',
    side: 'tool',
    text: 'Dosya dönüştürücü, sıkıştırıcı, PDF birleştirici ve medya indirici (Windows, PyQt6).',
    tags: ['Python', 'PyQt6', 'Masaüstü'],
    problem: 'Günlük dosya, PDF ve medya işlemleri için güvenilmez çevrimiçi web servislerine dosya yüklemek gizlilik riski oluşturur.',
    redAngle: 'Yerel çalışma sayesinde hassas dokümanların üçüncü parti sunuculara sızma yüzeyini ortadan kaldırır.',
    blueAngle: 'PyQt6 masaüstü arayüzü altında ffmpeg/PDF araçlarını tek çatı altında toplayarak güvenli çevrimdışı iş akışı sağlar.',
    demoCmd: 'omniverse',
  },
];

const TERMINALS = [
  {
    id: 't1',
    title: `${P.user}@${P.host}: ~`,
    pos: 'left-[3%] right-[3%] top-[52%] max-sm:max-h-[42%] sm:left-auto sm:right-[3%] sm:top-[11%] sm:w-[35%]',
    script: [
      { cmd: 'whoami' },
      { out: 'Emin Onur Tuğran — Yazılım Mühendisliği 3. sınıf' },
      { cmd: 'cat rol.txt' },
      { out: 'Purple Team — saldırıyı anlayan, savunmayı kuran.' },
      { out: 'Thinks like an attacker, builds like a defender.', dim: true },
      { cmd: 'ls ~/projeler' },
      { out: 'SSRF-Ghost/  google-dork-auditor/  Stealth-TCP-SYN-Scanner/', tone: 'text-[#8ab4ff]' },
      { out: 'BHP-Net-Tool/  Log-Analayzer/  omniverse/', tone: 'text-[#8ab4ff]' },
      { cmd: 'cat yetkinlikler.txt' },
      { out: 'red    → Metasploit, Burp Suite, Nmap, SQLMap, Hydra', tone: 'text-[#ff8a8a]' },
      { out: 'blue   → Splunk, olay müdahalesi, log analizi, DFIR', tone: 'text-[#8ab4ff]' },
      { out: 'purple → Cyber Kill Chain, saldırı → tespit döngüsü', tone: 'text-[#c4a1ff]' },
      { cmd: 'echo $GITHUB' },
      { out: 'github.com/OnurTugran' },
    ],
  },
  {
    id: 't2',
    title: `${P.user}@${P.host}: ~/tarama`,
    pos: 'left-[4%] right-[7%] top-[59%] sm:left-auto sm:right-[5%] sm:top-[44%] sm:w-[37%]',
    script: [
      { cmd: `nmap -sV ${P.domain}` },
      { out: `Nmap scan report for ${P.domain}`, dim: true },
      { out: 'PORT      STATE  SERVICE', head: true },
      { port: '22/tcp  ', tab: 'hakkimda' },
      { port: '80/tcp  ', tab: 'projeler' },
      { port: '443/tcp ', tab: 'yetkinlikler' },
      ...(P.cv ? [{ port: '8443/tcp', tab: 'cv' }] : []),
      { port: '8080/tcp', tab: 'iletisim' },
      { out: '# bir porta tıkla → ilgili sekme açılır', dim: true },
    ],
  },
  {
    id: 't3',
    title: `${P.user}@${P.host}: ~/lab`,
    pos: 'left-[2%] right-[12%] top-[69%] sm:left-[38%] sm:right-auto sm:top-auto sm:bottom-[4%] sm:w-[36%]',
    script: [
      { cmd: './purple-loop.sh' },
      { out: '[red]    saldırı senaryosu çalıştırıldı', tone: 'text-[#ff8a8a]' },
      { out: '[blue]   alarm üretildi, kural güncellendi', tone: 'text-[#8ab4ff]' },
      { out: '[purple] boşluk kapandı — döngü yeniden başlıyor', tone: 'text-[#c4a1ff]' },
      { out: '# t1 terminalinde "help" yaz veya ~/.auth.log incele', dim: true },
    ],
  },
];

// ─── Küçük yardımcılar ───
let zTop = 40;
const bringToFront = (el) => {
  if (el) el.style.zIndex = String(++zTop);
};

export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return now;
}
export const hhmm = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
export const day = (d) => d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });

export function Clock({ showDate = false, className = 'tabular-nums' }) {
  const now = useClock();
  return <span className={className}>{showDate ? `${day(now)} ${hhmm(now)}` : hhmm(now)}</span>;
}

export const Icon = {
  home: (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  ),
  folderLg: (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 10h18" opacity="0.5" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v4h4M9 12h6M9 15h6M9 18h4" opacity="0.6" />
    </svg>
  ),
  terminalLg: (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m7 10 3 2-3 2M12 15h5" strokeLinecap="round" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m7 10 3 2-3 2M12 15h5" strokeLinecap="round" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  power: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 3v8M7 6.5a7 7 0 1 0 10 0" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19" r="0.8" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3 4.5 6.5v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6.5L12 3Z" />
      <path d="m9.5 12.2 1.7 1.8 3.5-3.8" strokeLinecap="round" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="5.5" cy="12" r="2.2" />
      <circle cx="18.5" cy="6.5" r="2.2" />
      <circle cx="18.5" cy="17.5" r="2.2" />
      <path d="m7.5 11 8.8-3.8M7.5 13l8.8 3.8" />
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
    </svg>
  ),
};

export function Wallpaper({ theme }) {
  return <AmbientWallpaper theme={theme} />;
}

// Canlı interaktif Kali kilit ekranı
function LockScreen({ theme, onUnlock }) {
  const accent = theme?.accent || '#367bf0';
  const accent2 = theme?.accent2 || '#5ee6ff';

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        playLoginSuccess();
        onUnlock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onUnlock]);

  return (
    <div
      data-lock-screen
      role="dialog"
      aria-modal="true"
      aria-label="Kali kilit ekranı"
      className="k-toast absolute inset-0 z-[80] overflow-hidden bg-black text-white"
    >
      <img
        src={`${import.meta.env.BASE_URL}assets/uzaktan_masaustu.jpg`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
      />
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: 'screen' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="lock-kali-mask-boost" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0 0 1.55 0 -0.12  0 0 1.55 0 -0.12  0 0 1.55 0 -0.12  0 0 0 1 0" />
          </filter>
          <filter id="lock-kali-bloom" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <linearGradient id="lock-kali-sweep-grad" x1="0" y1="0" x2="1" y2="0.28">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="32%" stopColor={accent2} stopOpacity="0.65" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="70%" stopColor={accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          <mask id="lock-kali-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <rect x="0" y="0" width="1920" height="1080" fill="#000" />
            <image
              href={`${import.meta.env.BASE_URL}assets/uzaktan_masaustu.jpg`}
              x="0"
              y="0"
              width="1920"
              height="1080"
              preserveAspectRatio="xMidYMid meet"
              filter="url(#lock-kali-mask-boost)"
            />
          </mask>
        </defs>
        <g mask="url(#lock-kali-mask)">
          <rect className="kali-dragon-sweep" x="-480" y="-80" width="460" height="1240" fill="url(#lock-kali-sweep-grad)" opacity="0.72" />
        </g>
        <g filter="url(#lock-kali-bloom)" opacity="0.82">
          <g mask="url(#lock-kali-mask)">
            <rect className="kali-dragon-sweep" x="-480" y="-80" width="460" height="1240" fill="url(#lock-kali-sweep-grad)" opacity="0.72" />
          </g>
        </g>
      </svg>

      <div className="absolute inset-0 grid place-items-center bg-black/45 px-4 backdrop-blur-sm">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/15 bg-[#080b18]/85 p-8 text-center shadow-[0_32px_90px_rgba(0,0,0,0.85)] backdrop-blur-md">
          <Clock showDate className="font-mono text-2xl tracking-wide text-white tabular-nums sm:text-3xl" />
          <div className="relative mt-6 h-24 w-24">
            <div
              className="k-lock-ring absolute -inset-1 rounded-full border-2 border-dashed"
              style={{ borderColor: accent }}
              aria-hidden="true"
            />
            <span className="block h-full w-full overflow-hidden rounded-full border border-white/20 bg-black">
              <img src={`${import.meta.env.BASE_URL}assets/profil.jpg`} alt="" className="h-full w-full object-cover" />
            </span>
          </div>
          <p className="mt-4 font-mono text-sm font-bold text-white">
            {P.user}@{P.host}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-white/45">SESSION LOCKED · LEAST PRIVILEGE</p>
          <button
            type="button"
            onClick={() => {
              playLoginSuccess();
              onUnlock();
            }}
            className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 font-mono text-xs font-medium text-white shadow-[0_0_24px_-4px_var(--k-accent,#367bf0)] transition hover:brightness-110"
            style={{ backgroundColor: accent }}
          >
            <span>Oturumu Aç</span>
            <span aria-hidden="true">→</span>
          </button>
          <p className="mt-3 font-mono text-[10px] text-white/40">Enter veya Space tuşuyla da açılabilir</p>
        </div>
      </div>
    </div>
  );
}

const clamp = (v, lo, hi) => (lo > hi ? lo : Math.min(hi, Math.max(lo, v)));

function clampWinOffset(el, cur, nx, ny) {
  const parent = el.offsetParent || document.documentElement;
  const pr = parent.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return { x: nx, y: ny };
  const baseLeft = r.left - cur.x;
  const baseTop = r.top - cur.y;
  return {
    x: clamp(nx, pr.left + 80 - r.width - baseLeft, pr.right - 80 - baseLeft),
    y: clamp(ny, pr.top + 32 - baseTop, pr.bottom - 36 - baseTop),
  };
}

// ─── Pencere çerçevesi: başlık çubuğundan sürüklenir, küçültülür/büyütülür, tıklanınca öne gelir ───
function Win({ id, ws, active, onFocus, className, closed, minimized, maximized, onMinimize, onToggleMax, onClose, bar, children, label }) {
  const ref = useRef(null);
  const off = useRef({ x: 0, y: 0 });
  const dragCleanupRef = useRef(null);
  const hidden = closed || minimized;

  // Aynı çalışma alanında kapalı/küçültülmüş → açık geçişinde hafifçe büyüyerek belirir;
  // çalışma alanı değişiminde z-order ve animasyon bozulmaz.
  const prevHidden = useRef(hidden);
  const prevWs = useRef(ws);
  useEffect(() => {
    const wasHidden = prevHidden.current;
    const sameWs = prevWs.current === ws;
    prevHidden.current = hidden;
    prevWs.current = ws;
    if (!wasHidden || hidden || !sameWs || !ref.current) return;
    gsap.fromTo(
      ref.current,
      { autoAlpha: 0, scale: 0.95, y: 12 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'transform' },
    );
  }, [hidden, ws]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.translate = maximized ? '0px 0px' : `${off.current.x}px ${off.current.y}px`;
  }, [maximized]);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  useEffect(() => {
    const onResize = () => {
      const el = ref.current;
      if (!el || maximized || (off.current.x === 0 && off.current.y === 0)) return;
      const next = clampWinOffset(el, off.current, off.current.x, off.current.y);
      if (next.x !== off.current.x || next.y !== off.current.y) {
        off.current = next;
        el.style.translate = `${next.x}px ${next.y}px`;
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [maximized]);

  const startDrag = (e) => {
    if (maximized || e.button !== 0 || e.pointerType === 'touch' || e.target.closest('button, a, input')) return;
    const el = ref.current;
    if (!el) return;
    dragCleanupRef.current?.();
    const parent = el.offsetParent || document.documentElement;
    const pr = parent.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const baseLeft = r.left - off.current.x;
    const baseTop = r.top - off.current.y;
    const minX = pr.left + 80 - r.width - baseLeft;
    const maxX = pr.right - 80 - baseLeft;
    const minY = pr.top + 32 - baseTop;
    const maxY = pr.bottom - 36 - baseTop;
    const sx = e.clientX - off.current.x;
    const sy = e.clientY - off.current.y;
    const move = (ev) => {
      const next = {
        x: clamp(ev.clientX - sx, minX, maxX),
        y: clamp(ev.clientY - sy, minY, maxY),
      };
      off.current = next;
      el.style.translate = `${next.x}px ${next.y}px`;
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      dragCleanupRef.current = null;
    };
    dragCleanupRef.current = end;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return (
    <section
      ref={ref}
      data-win={id}
      aria-label={label}
      onPointerDownCapture={() => {
        bringToFront(ref.current);
        onFocus?.(id);
      }}
      className={`absolute flex flex-col overflow-hidden rounded-lg border bg-[#12141c]/95 backdrop-blur transition-[border-color,box-shadow] duration-200 ${
        active
          ? 'k-win-active'
          : 'border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_-12px_rgba(0,0,0,0.75)]'
      } ${hidden ? 'hidden' : ''} ${maximized ? 'left-2 right-2 top-10 bottom-2' : className}`}
    >
      <div
        onPointerDown={startDrag}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--wx', `${(e.clientX - r.left).toFixed(1)}px`);
        }}
        onDoubleClick={(e) => {
          if (!e.target.closest('button, a, input')) onToggleMax?.();
        }}
        className={`k-win-bar-sheen flex shrink-0 select-none items-center gap-2 bg-[#1b1e27] pl-3 pr-1.5 ${
          active ? 'border-b border-white/10' : ''
        } ${maximized ? '' : 'sm:cursor-grab'}`}
      >
        <div className="min-w-0 flex-1">{bar}</div>
        <div className="flex items-center gap-1 text-white/55">
          <button
            type="button"
            onClick={onMinimize}
            aria-label={`${label} penceresini küçült`}
            className="grid h-5 w-5 place-items-center rounded text-[13px] leading-none hover:bg-white/10 hover:text-white"
          >
            –
          </button>
          <button
            type="button"
            onClick={onToggleMax}
            aria-label={maximized ? `${label} penceresini eski boyutuna getir` : `${label} penceresini büyüt`}
            className="grid h-5 w-5 place-items-center rounded text-[10px] leading-none hover:bg-white/10 hover:text-white"
          >
            ▢
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={`${label} penceresini kapat`}
            className="grid h-5 w-5 place-items-center rounded text-[13px] leading-none hover:bg-[#e5484d] hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

// ─── Terminal & Canlı Kabuk Motoru ───
const AUTH_LOG = [
  'Nov 20 17:01:04 kali sshd[412]: Accepted publickey for onur from 10.0.13.10 port 51822',
  'Nov 20 17:04:19 kali systemd[1]: Started purple-loop.service (Blue Team Sensor)',
  'Nov 20 17:09:42 kali sshd[889]: FAILED password for root from 185.220.101.4 — root GUI disabled',
  'Nov 20 17:11:03 kali siem-agent[509]: ALERT [CRT-01] fsociety00.dat anomalisi token=RkxBR3twdXJwbGVfbG9vcF9jbG9zZWR9',
  'Nov 20 17:11:05 kali kernel: [UFW BLOCK] IN=eth0 SRC=185.220.101.4 PROTO=TCP DPT=22',
];
const CTF_FLAG = 'FLAG{purple_loop_closed}';

const TERM_COMMANDS = [
  'help',
  'neofetch',
  'fastfetch',
  'clear',
  'whoami',
  'id',
  'uname -a',
  'pwd',
  'date',
  'ls',
  'ls -la',
  'ls ~/projeler',
  'cat rol.txt',
  'cat yetkinlikler.txt',
  'cat .notes',
  'cat .auth.log',
  'grep FAILED .auth.log',
  'grep CRT-01 .auth.log',
  'base64 -d ',
  'submit ',
  'open hakkimda',
  'open projeler',
  'open yetkinlikler',
  'open iletisim',
  'nmap onurtugran.local',
  'ssrf-ghost --demo',
  'syn-scan 10.0.13.37',
  'log-analyzer --sample',
  'dork-audit',
  'bhp-net',
  'omniverse',
];

const KALI_ASCII = [
  ' ..............            ',
  '         ..,;:ccc,.        ',
  "       ......''';lxO.      ",
  ".....''''''''''';ld;       ",
  '           .;;;:::;,,.     ',
  '      ..;;;::::;;;;;;;:.   ',
  '    .::::;;;;::::::;;;;;:  ',
  "   .:::;'          ';;;;:  ",
  "  .::'              ';;:.  ",
  "  ;:'                 ';   ",
];

function decodeBase64Safe(str) {
  try {
    const bin = atob(str.trim());
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

function Prompt({ children }) {
  return (
    <>
      <div className="whitespace-pre">
        <span className="text-[#5fb87a]">┌──(</span>
        <span className="font-bold text-[#6f9cff]">
          {P.user}㉿{P.host}
        </span>
        <span className="text-[#5fb87a]">)-[</span>
        <span className="font-bold text-white">~</span>
        <span className="text-[#5fb87a]">]</span>
      </div>
      <div className="whitespace-pre">
        <span className="text-[#5fb87a]">└─</span>
        <span className="font-bold text-[#6f9cff]">$ </span>
        {children}
      </div>
    </>
  );
}

function Terminal({
  t,
  ws,
  active,
  onFocus,
  closed,
  minimized,
  maximized,
  onMinimize,
  onToggleMax,
  onClose,
  openTab,
  execReq,
  onCtfSolve,
  onTriggerGlitch,
}) {
  const interactive = t.id === 't1';
  const [history, setHistory] = useState([]);
  const [clearedBase, setClearedBase] = useState(false);
  const [input, setInput] = useState('');
  const [cmdHist, setCmdHist] = useState([]);
  const [histCursor, setHistCursor] = useState(-1);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const lastSeqRef = useRef(0);

  const runCommand = (raw, silent = false) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!silent) playKeyClick();
    setCmdHist((h) => [...h, trimmed]);
    setHistCursor(-1);
    const low = trimmed.toLowerCase();

    if (low === 'clear') {
      setClearedBase(true);
      setHistory([]);
      return;
    }

    const lines = [];
    if (low.includes('rm -rf')) {
      lines.push({ out: '[SIEM] Yetkisiz yıkıcı işlem engellendi (MITRE T1485 — Data Destruction).', tone: 'text-[#ff8a8a]' });
      lines.push({ out: '[BLUE] Süreç izole edildi; alarm kaydedildi.', tone: 'text-[#8ab4ff]' });
      playStaticTick();
      onTriggerGlitch?.();
    } else if (low === 'sudo su' || low === 'su root' || low.startsWith('sudo ')) {
      lines.push({ out: `[PAM] root oturumu devre dışı (least privilege) — aktif kullanıcı: ${P.user}`, tone: 'text-[#ff8a8a]' });
    } else if (low === 'fsociety') {
      lines.push({ out: '[CRT-01] fsociety00.dat karantinada. İpucu: ls -la && cat .auth.log', tone: 'text-[#c4a1ff]' });
    } else if (low === 'help' || low === '?') {
      lines.push({ out: 'Kullanılabilir komutlar:', tone: 'text-white' });
      lines.push({ out: '  sistem/özet  : neofetch, whoami, id, uname -a, ls, ls -la, cat <dosya>, grep <desen> .auth.log, base64 -d <kod>' });
      lines.push({ out: '  navigasyon   : open <hakkimda|projeler|yetkinlikler|iletisim>, nmap onurtugran.local' });
      lines.push({ out: '  araç demoları: ssrf-ghost --demo, syn-scan 10.0.13.37, log-analyzer --sample, dork-audit, bhp-net, omniverse', tone: 'text-[#c4a1ff]' });
      lines.push({ out: '  mini-ctf     : ~/.auth.log içindeki gizli tokeni çözüp "submit FLAG{...}" ile bildir', tone: 'text-[#6effbe]' });
    } else if (low === 'neofetch' || low === 'fastfetch') {
      lines.push({ neofetch: true });
    } else if (low === 'whoami') {
      lines.push({ out: P.user });
    } else if (low === 'id') {
      lines.push({ out: `uid=1000(${P.user}) gid=1000(${P.user}) groups=1000(${P.user}),27(sudo-disabled),131(wireshark)` });
    } else if (low === 'uname -a') {
      lines.push({ out: `Linux ${P.host} 6.8.11-kali-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux` });
    } else if (low === 'pwd') {
      lines.push({ out: `/home/${P.user}` });
    } else if (low === 'date') {
      lines.push({ out: new Date().toLocaleString('tr-TR') });
    } else if (low === 'ls') {
      lines.push({ out: 'projeler/  rol.txt  yetkinlikler.txt', tone: 'text-[#8ab4ff]' });
    } else if (low === 'ls -la' || low === 'ls -al') {
      lines.push({ out: 'drwx------  .         -rw-r--r--  rol.txt', dim: true });
      lines.push({ out: '-rw-------  .auth.log -rw-r--r--  yetkinlikler.txt', tone: 'text-[#c4a1ff]' });
      lines.push({ out: '-rw-r--r--  .notes    drwxr-xr-x  projeler/' });
    } else if (low === 'ls ~/projeler' || low === 'ls projeler') {
      lines.push({ out: PROJECTS.map((p) => `${p.name}/`).join('  '), tone: 'text-[#8ab4ff]' });
    } else if (low === 'cat rol.txt') {
      lines.push({ out: 'Purple Team — saldırıyı anlayan, savunmayı kuran.' });
    } else if (low === 'cat yetkinlikler.txt') {
      lines.push({ out: 'red    → Metasploit, Burp Suite, Nmap, SQLMap, Hydra', tone: 'text-[#ff8a8a]' });
      lines.push({ out: 'blue   → Splunk, olay müdahalesi, log analizi, DFIR', tone: 'text-[#8ab4ff]' });
      lines.push({ out: 'purple → Cyber Kill Chain, saldırı → tespit döngüsü', tone: 'text-[#c4a1ff]' });
    } else if (low === 'cat .notes') {
      lines.push({ out: '# CRT-01 uyarısı için: grep CRT-01 .auth.log → base64 -d <token> → submit <FLAG>', tone: 'text-[#c4a1ff]' });
    } else if (low === 'cat .auth.log' || low === 'cat ~/.auth.log') {
      AUTH_LOG.forEach((line) =>
        lines.push({
          out: line,
          tone: line.includes('ALERT') ? 'text-[#ff8a8a]' : line.includes('FAILED') ? 'text-[#fbbf24]' : undefined,
        }),
      );
    } else if (low.startsWith('grep ')) {
      const rest = trimmed.slice(5).trim();
      const parts = rest.split(/\s+/);
      const pattern = (parts[0] || '').replace(/^["']|["']$/g, '');
      const target = (parts[1] || '.auth.log').toLowerCase();
      if (!pattern) {
        lines.push({ out: 'Kullanım: grep <desen> .auth.log', tone: 'text-[#ff8a8a]' });
      } else if (target.includes('auth.log')) {
        const hits = AUTH_LOG.filter((l) => l.toLowerCase().includes(pattern.toLowerCase()));
        if (hits.length) hits.forEach((h) => lines.push({ out: h, tone: 'text-[#6effbe]' }));
        else lines.push({ out: `Eşleşme bulunamadı: ${pattern}`, dim: true });
      } else {
        lines.push({ out: `Dosya bulunamadı: ${parts[1]}`, tone: 'text-[#ff8a8a]' });
      }
    } else if (low.startsWith('base64 -d ') || low.startsWith('base64 --decode ')) {
      const payload = trimmed.replace(/^base64\s+(-d|--decode)\s+/i, '').replace(/^["']|["']$/g, '');
      const decoded = decodeBase64Safe(payload);
      if (decoded) lines.push({ out: decoded, tone: 'text-[#6effbe]' });
      else lines.push({ out: 'base64: geçersiz girdi', tone: 'text-[#ff8a8a]' });
    } else if (low.startsWith('submit ') || trimmed === CTF_FLAG) {
      const candidate = low.startsWith('submit ') ? trimmed.slice(7).trim() : trimmed;
      if (candidate === CTF_FLAG) {
        lines.push({ out: '[✓] INCIDENT CONTAINED — CTF SOLVED', tone: 'text-[#6effbe]' });
        lines.push({ out: '[PURPLE] CRT-01 anomalisi kapatıldı. Üst panelde "⚑ CTF" rozeti açıldı!', tone: 'text-[#c4a1ff]' });
        playLoginSuccess();
        onCtfSolve?.();
      } else {
        lines.push({ out: `[✗] Geçersiz flag: "${candidate}" (.auth.log içindeki token= değerini base64 -d ile çöz)`, tone: 'text-[#ff8a8a]' });
      }
    } else if (low.startsWith('open ')) {
      const target = low.slice(5).trim();
      const foundTab = TABS.find((tb) => tb.id === target);
      if (foundTab) {
        openTab(foundTab.id);
        lines.push({ out: `[+] Tarayıcıda /${foundTab.id} açıldı.`, tone: 'text-[#6effbe]' });
      } else {
        lines.push({ out: `Bilinmeyen sekme: ${target} (seçenekler: ${TABS.map((x) => x.id).join(', ')})`, tone: 'text-[#ff8a8a]' });
      }
    } else if (low === 'nmap' || low.startsWith('nmap ')) {
      lines.push({ out: `Starting Nmap 7.95 against ${P.domain}...`, dim: true });
      lines.push({ out: 'PORT      STATE  SERVICE', head: true });
      lines.push({ port: '22/tcp  ', tab: 'hakkimda' });
      lines.push({ port: '80/tcp  ', tab: 'projeler' });
      lines.push({ port: '443/tcp ', tab: 'yetkinlikler' });
      if (P.cv) lines.push({ port: '8443/tcp', tab: 'cv' });
      lines.push({ port: '8080/tcp', tab: 'iletisim' });
    } else if (low.startsWith('ssrf-ghost')) {
      lines.push({ out: '[SSRF-Ghost] 4 WAF bypass vektörü test ediliyor...', tone: 'text-[#c4a1ff]' });
      lines.push({ out: '  ↳ http://0251.0376.0251.0376/latest/meta-data  [BYPASS 200 OK]', tone: 'text-[#ff8a8a]' });
      lines.push({ out: '[BLUE] Öneri: IP normalizasyonu sonrası egress allowlist uygula.', tone: 'text-[#8ab4ff]' });
    } else if (low.startsWith('syn-scan')) {
      lines.push({ out: '[SYN-Scanner] Raw socket stealth scan → 10.0.13.37', tone: 'text-[#ff8a8a]' });
      lines.push({ out: '  22/tcp  SYN/ACK → open   (RST sent, tam el sıkışma yok)' });
      lines.push({ out: '  443/tcp SYN/ACK → open   (RST sent)' });
      lines.push({ out: '[BLUE] SIEM korelasyon kuralı: 5 sn içinde >20 half-open SYN.', tone: 'text-[#8ab4ff]' });
    } else if (low.startsWith('log-analyzer')) {
      lines.push({ out: '[Log-Analayzer] Isolation Forest (n_estimators=100) Security.evtx taranıyor...', tone: 'text-[#8ab4ff]' });
      lines.push({ out: '  [!] EventID 4625/4672 skor=-0.78 (saat 03:14 sıra dışı yetki yükseltme)', tone: 'text-[#ff8a8a]' });
      lines.push({ out: '[OK] 4.210 olay arasından 2 kritik anomali izole edildi.', tone: 'text-[#6effbe]' });
    } else if (low.startsWith('dork-audit')) {
      lines.push({ out: '[Dork-Auditor] Pasif OSINT yüzeyi taranıyor...', tone: 'text-[#c4a1ff]' });
      lines.push({ out: '  [!] filetype:env "DB_PASSWORD"  → 1 açık indeks adayı tespit edildi', tone: 'text-[#ff8a8a]' });
      lines.push({ out: '[PURPLE] Kapatma: robots/web-root erişim kısıtı önerildi.', tone: 'text-[#8ab4ff]' });
    } else if (low.startsWith('bhp-net')) {
      lines.push({ out: '[BHP-Net] Threaded TCP dinleyici başlatıldı 0.0.0.0:4444', tone: 'text-[#ff8a8a]' });
      lines.push({ out: '  [+] Lab bağlantısı kuruldu → etkileşimli kabuk hazır' });
    } else if (low.startsWith('omniverse')) {
      lines.push({ out: '[omniverse] Yerel çevrimdışı mod — harici bulut yüklemesi yok', tone: 'text-[#6effbe]' });
      lines.push({ out: '  [✓] PDF birleştirme & medya sıkıştırma hattı hazır (PyQt6)' });
    } else {
      lines.push({ out: `zsh: komut bulunamadı: ${trimmed.split(/\s+/)[0]} ("help" yaz)`, tone: 'text-[#ff8a8a]' });
    }

    setHistory((h) => [...h, { cmd: trimmed, lines }]);
  };

  useEffect(() => {
    if (!interactive || !execReq || execReq.seq === lastSeqRef.current) return;
    lastSeqRef.current = execReq.seq;
    runCommand(execReq.cmd);
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  });

  useEffect(() => {
    if (!interactive || !bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history, clearedBase, interactive]);

  const onSubmit = (e) => {
    e.preventDefault();
    const val = input;
    setInput('');
    runCommand(val);
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!cmdHist.length) return;
      const nextIdx = histCursor === -1 ? cmdHist.length - 1 : Math.max(0, histCursor - 1);
      setHistCursor(nextIdx);
      setInput(cmdHist[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histCursor === -1) return;
      if (histCursor >= cmdHist.length - 1) {
        setHistCursor(-1);
        setInput('');
      } else {
        const nextIdx = histCursor + 1;
        setHistCursor(nextIdx);
        setInput(cmdHist[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const q = input.trim().toLowerCase();
      if (!q) return;
      const match = TERM_COMMANDS.find((c) => c.toLowerCase().startsWith(q));
      if (match) setInput(match);
    }
  };

  return (
    <Win
      id={t.id}
      ws={ws}
      active={active}
      onFocus={onFocus}
      label={`Terminal: ${t.title}`}
      closed={closed}
      minimized={minimized}
      maximized={maximized}
      onMinimize={onMinimize}
      onToggleMax={onToggleMax}
      onClose={onClose}
      className={`max-h-[30%] sm:max-h-[44%] ${t.pos}`}
      bar={<p className="truncate py-1.5 text-center font-mono text-[11px] text-white/55">{t.title}</p>}
    >
      {/* Kaydırılabilir gövde: eski satırlar için yukarı kaydırılabilir; yeni satırlar altta. */}
      <div
        ref={bodyRef}
        data-term-body
        onClick={() => interactive && inputRef.current?.focus({ preventScroll: true })}
        className="k-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2.5 font-mono text-[10.5px] leading-[1.55] text-white/85 sm:text-[12px]"
      >
        <div className="flex min-h-full flex-col justify-end">
          {!clearedBase &&
            t.script.map((s, i) => {
              if (s.cmd)
                return (
                  <div key={i} data-line className={i ? 'mt-1.5' : ''}>
                    <Prompt>
                      <span data-type className="k-type">
                        {s.cmd}
                      </span>
                    </Prompt>
                  </div>
                );
              if (s.port)
                return (
                  <button
                    key={i}
                    type="button"
                    data-line
                    onClick={() => openTab(s.tab)}
                    className="block w-full whitespace-pre rounded-sm text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                  >
                    {s.port}  <span className="text-[#5fb87a]">open</span>   <span className="underline decoration-white/25 underline-offset-2">{s.tab}</span>
                  </button>
                );
              return (
                <div
                  key={i}
                  data-line
                  className={`whitespace-pre-wrap ${s.dim ? 'text-white/40' : ''} ${s.head ? 'font-bold text-white' : ''} ${s.tone ?? ''}`}
                >
                  {s.out}
                </div>
              );
            })}

          {interactive &&
            history.map((entry, idx) => (
              <div key={idx} className="mt-1.5">
                <Prompt>
                  <span>{entry.cmd}</span>
                </Prompt>
                {entry.lines.map((ln, j) =>
                  ln.neofetch ? (
                    <div key={j} className="my-2 grid gap-3 rounded border border-white/10 bg-white/[0.02] p-2.5 sm:grid-cols-[auto_1fr]">
                      <pre className="leading-[1.2] text-[#6f9cff]">{KALI_ASCII.join('\n')}</pre>
                      <div className="space-y-0.5 text-[10.5px] sm:text-[11px]">
                        <p className="font-bold text-[#6effbe]">
                          {P.user}@{P.host}
                        </p>
                        <p className="text-white/30">─────────────────</p>
                        <p>
                          <span className="text-[#8ab4ff]">OS:</span> Kali GNU/Linux Rolling
                        </p>
                        <p>
                          <span className="text-[#8ab4ff]">Role:</span> Purple Team (Red / Blue)
                        </p>
                        <p>
                          <span className="text-[#8ab4ff]">Edu:</span> İZÜ Yazılım Müh. (3. sınıf)
                        </p>
                        <p>
                          <span className="text-[#8ab4ff]">Certs:</span> NATO STO · Huawei ICT
                        </p>
                        <p>
                          <span className="text-[#8ab4ff]">Langs:</span> Python, C++, C, SQL
                        </p>
                        <p>
                          <span className="text-[#8ab4ff]">Repos:</span> {PROJECTS.length} güvenlik &amp; araç deposu
                        </p>
                        <p>
                          <span className="text-[#8ab4ff]">Status:</span>{' '}
                          <span className="text-[#6effbe]">Güvenlik ekibinde staj arıyor</span>
                        </p>
                        <div className="flex gap-1 pt-1.5" aria-hidden="true">
                          {['bg-[#1f2430]', 'bg-[#ff8a8a]', 'bg-[#5fb87a]', 'bg-[#fbbf24]', 'bg-[#6f9cff]', 'bg-[#c4a1ff]', 'bg-[#5ee6ff]', 'bg-white/80'].map(
                            (bg) => (
                              <span key={bg} className={`h-2.5 w-3.5 rounded-[2px] ${bg}`} />
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : ln.port ? (
                    <button
                      key={j}
                      type="button"
                      onClick={() => openTab(ln.tab)}
                      className="block w-full whitespace-pre rounded-sm text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      {ln.port}  <span className="text-[#5fb87a]">open</span>   <span className="underline decoration-white/25 underline-offset-2">{ln.tab}</span>
                    </button>
                  ) : (
                    <div
                      key={j}
                      className={`whitespace-pre-wrap ${ln.dim ? 'text-white/45' : ''} ${ln.head ? 'font-bold text-white' : ''} ${ln.tone ?? ''}`}
                    >
                      {ln.out}
                    </div>
                  ),
                )}
              </div>
            ))}

          {interactive ? (
            <div data-term-input className="mt-2">
              <div className="mb-1.5 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                {['help', 'neofetch', 'ls -la', 'cat .auth.log', 'ssrf-ghost --demo'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      runCommand(chip);
                      inputRef.current?.focus({ preventScroll: true });
                    }}
                    className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/60 transition hover:border-[#a78bfa]/50 hover:bg-white/10 hover:text-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit}>
                <Prompt>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder='komut yaz ("help")…'
                    aria-label="Terminal komut girişi"
                    autoComplete="off"
                    spellCheck="false"
                    className="min-w-[120px] flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                  />
                </Prompt>
              </form>
            </div>
          ) : (
            <div className="mt-1.5">
              <Prompt>
                <span className="k-cursor" aria-hidden="true" />
              </Prompt>
            </div>
          )}
        </div>
      </div>
    </Win>
  );
}

// ─── Tarayıcı sekmelerinin içerikleri ───
const Label = ({ children }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">{children}</p>
);

const SIDE = {
  red: { label: 'red', tone: 'text-[#ff8a8a]' },
  blue: { label: 'blue', tone: 'text-[#8ab4ff]' },
  purple: { label: 'purple', tone: 'text-[#c4a1ff]' },
  tool: { label: 'araç', tone: 'text-white/55' },
};

const ExtLink = ({ href, children, className = '' }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={`underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-[#a78bfa] ${className}`}
  >
    {children}
  </a>
);

function TabContent({ id, selectedProject, onSelectProject, filter, setFilter, onRunDemo }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard?.writeText(P.email).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  };

  if (id === 'hakkimda')
    return (
      <div className="space-y-5">
        <Label>~/hakkimda</Label>
        <h2 className="font-serif text-4xl leading-none text-white sm:text-5xl">{P.name}</h2>
        <p className="max-w-prose text-sm leading-relaxed text-white/70 sm:text-[15px]">
          Siber güvenlik süreçleri, ağ altyapıları ve defansif (Blue Team/SOC) temellere odaklanan bir Yazılım Mühendisliği
          öğrencisiyim. Python ve C++ ile kendi ağ analiz araçlarımı geliştiriyor; Burp Suite ve PortSwigger
          laboratuvarlarında web mimarisini ve zafiyetlerini uygulamalı çalışıyorum. Saldırı tarafını anlamak, savunmayı
          daha iyi kurmak için.
        </p>
        <dl className="grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 text-sm sm:grid-cols-3">
          {[
            ['Odak', 'Blue Team / SOC, ağ ve web güvenliği'],
            ['Eğitim', 'İstanbul Sabahattin Zaim Üniv. — Yazılım Müh. (3. sınıf)'],
            ['Durum', 'Güvenlik ekibinde staj arıyorum'],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#0f121a] p-3">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{k}</dt>
              <dd className="mt-1 text-white/80">{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <Label>sertifikalar</Label>
          <ul className="mt-3 space-y-1.5 text-sm text-white/70">
            <li>NATO STO Yaz Okulu — Çift Kullanımlı Kuantum Teknolojileri (Delft) · Tem 2026</li>
            <li>Huawei ICT Akademi — Yapay Zeka, Bulut Bilişim, IoT, 5G, Veri Bilimi · Ağu 2025</li>
          </ul>
        </div>
        <p className="font-mono text-[11px] text-white/45">Diller: İngilizce B2 · İspanyolca A1 · Konum: İstanbul</p>
      </div>
    );

  if (id === 'projeler') {
    const proj = selectedProject ? PROJECTS.find((p) => p.name === selectedProject) : null;
    if (proj) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onSelectProject(null)}
              className="font-mono text-[11px] text-white/70 underline decoration-white/25 underline-offset-4 hover:text-white"
            >
              ← Projelere Dön
            </button>
            <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${SIDE[proj.side].tone}`}>
              {SIDE[proj.side].label}
            </span>
          </div>

          <div className="group overflow-hidden rounded-md border border-white/10 bg-[#0b0e16] px-4 py-3">
            <ProjectCover name={proj.name} side={proj.side} />
          </div>

          <div>
            <h2 className="font-mono text-2xl text-white sm:text-3xl">{proj.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{proj.text}</p>
            <p className="mt-2 font-mono text-[11px] text-[#c4a1ff]/85">{proj.tags.join(' · ')}</p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="rounded-md border border-white/10 bg-[#0f121a] p-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Problem</p>
              <p className="mt-1.5 leading-relaxed text-white/75">{proj.problem}</p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-[#0f121a] p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff8a8a]">Saldırı / Red Açısı</p>
                <p className="mt-1.5 leading-relaxed text-white/75">{proj.redAngle}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0f121a] p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8ab4ff]">Savunma / Blue Açısı</p>
                <p className="mt-1.5 leading-relaxed text-white/75">{proj.blueAngle}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onRunDemo(proj.demoCmd)}
              className="inline-flex items-center gap-2 rounded-md border border-[#a78bfa]/40 bg-[#a78bfa]/15 px-3.5 py-2 font-mono text-xs text-[#e3d4ff] transition hover:bg-[#a78bfa]/25 hover:text-white"
            >
              Terminalde Çalıştır <span aria-hidden="true">▶</span>
            </button>
            <ExtLink href={REPO(proj.name)} className="font-mono text-xs text-white/75">
              GitHub&apos;da Gör ↗
            </ExtLink>
          </div>
        </div>
      );
    }

    const visible = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.side === filter);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Label>~/projeler</Label>
          <ExtLink href={P.github} className="font-mono text-[11px] text-white/55">
            github.com/OnurTugran ↗
          </ExtLink>
        </div>
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {[
            ['all', 'Tümü'],
            ['red', 'Red'],
            ['blue', 'Blue'],
            ['purple', 'Purple'],
            ['tool', 'Araç'],
          ].map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={`rounded-full border px-2.5 py-0.5 transition ${
                filter === k
                  ? 'border-[var(--k-accent,#a78bfa)]/60 bg-[var(--k-accent,#a78bfa)]/20 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white/85'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onSelectProject(p.name)}
              onPointerMove={(e) => {
                if (e.pointerType !== 'mouse') return;
                const r = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const rx = ((0.5 - y / r.height) * 7).toFixed(2);
                const ry = ((x / r.width - 0.5) * 8).toFixed(2);
                e.currentTarget.style.setProperty('--mx', `${x.toFixed(1)}px`);
                e.currentTarget.style.setProperty('--my', `${y.toFixed(1)}px`);
                e.currentTarget.style.setProperty('--rx', `${rx}deg`);
                e.currentTarget.style.setProperty('--ry', `${ry}deg`);
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty('--rx', '0deg');
                e.currentTarget.style.setProperty('--ry', '0deg');
              }}
              className="k-holo-card group block w-full overflow-hidden rounded-md border border-white/10 bg-[#0f121a] text-left hover:border-[var(--k-accent,#a78bfa)]/55 hover:bg-[#141826] hover:shadow-[0_0_28px_-8px_rgba(var(--k-accent-rgb,167,139,250),0.38)]"
            >
              <div className="border-b border-white/10 bg-[#0b0e16] px-2 py-1 transition-opacity group-hover:opacity-100 sm:opacity-80">
                <ProjectCover name={p.name} side={p.side} />
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-mono text-[15px] text-white group-hover:text-[#d9c8ff]">{p.name}</h3>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${SIDE[p.side].tone}`}>{SIDE[p.side].label}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">{p.text}</p>
                <p className="mt-3 font-mono text-[11px] text-[#c4a1ff]/80">{p.tags.join(' · ')}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'yetkinlikler') {
    const SKILL_PROJECT = {
      'Burp Suite': 'SSRF-Ghost',
      'Web zafiyet laboratuvarları': 'SSRF-Ghost',
      Nmap: 'Stealth-TCP-SYN-Scanner',
      'SIEM (Splunk)': 'Log-Analayzer',
      'Olay müdahalesi': 'Log-Analayzer',
      'Log analizi': 'Log-Analayzer',
      'Saldırı → tespit döngüsü': 'google-dork-auditor',
    };
    const TECH_LINKS = {
      Diller: ['SSRF-Ghost', 'BHP-Net-Tool'],
      'Ağ & sistem': ['Stealth-TCP-SYN-Scanner'],
      'Veri & ML': ['Log-Analayzer'],
      Araştırma: ['google-dork-auditor'],
    };
    return (
      <div className="space-y-4">
        <Label>~/yetkinlikler</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Red', 'text-[#ff8a8a]', ['Metasploit', 'Burp Suite', 'Nmap', 'SQLMap', 'Gobuster', 'Hydra', 'John the Ripper']],
            ['Blue', 'text-[#8ab4ff]', ['SIEM (Splunk)', 'Olay müdahalesi', 'Log analizi', 'Dijital adli bilişim (DFIR)']],
            ['Purple', 'text-[#c4a1ff]', ['Cyber Kill Chain', 'Saldırı → tespit döngüsü', 'Web zafiyet laboratuvarları']],
          ].map(([title, tone, list]) => (
            <div key={title} className="rounded-md border border-white/10 bg-[#0f121a] p-4">
              <h3 className={`font-mono text-xs uppercase tracking-[0.25em] ${tone}`}>{title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                {list.map((x) => {
                  const target = SKILL_PROJECT[x];
                  return target ? (
                    <li key={x}>
                      <button
                        type="button"
                        onClick={() => onSelectProject(target)}
                        title={`Projeyi aç: ${target}`}
                        className="inline-flex items-center gap-1 text-left text-white/85 underline decoration-white/25 underline-offset-4 transition hover:text-[#d9c8ff] hover:decoration-[#a78bfa]"
                      >
                        <span>{x}</span>
                        <span className="font-mono text-[10px] text-[#c4a1ff]">↗</span>
                      </button>
                    </li>
                  ) : (
                    <li key={x}>{x}</li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <dl className="divide-y divide-white/10 rounded-md border border-white/10 bg-[#0f121a] text-sm">
          {[
            ['Diller', 'Python, C++, C, SQL, HTML'],
            ['Ağ & sistem', 'Linux CLI, Windows (Active Directory, PowerShell), Wireshark, Tcpdump, TCP/IP, OSI'],
            ['Veri & ML', 'Scikit-Learn, TensorFlow'],
            ['Araştırma', 'Yapay zeka güvenliği, kriptografi temelleri, çift kullanımlı kuantum teknolojileri'],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1.5 p-3 sm:grid-cols-[120px_1fr]">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{k}</dt>
              <dd className="space-y-1.5 text-white/75">
                <p>{v}</p>
                {TECH_LINKS[k] && (
                  <div className="flex flex-wrap gap-1.5">
                    {TECH_LINKS[k].map((projName) => (
                      <button
                        key={projName}
                        type="button"
                        onClick={() => onSelectProject(projName)}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#c4a1ff] transition hover:border-[#a78bfa]/50 hover:bg-[#a78bfa]/15 hover:text-white"
                      >
                        {projName} ↗
                      </button>
                    ))}
                  </div>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (id === 'cv')
    return (
      <div className="flex h-full min-h-[420px] flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Label>~/cv.pdf</Label>
          <span className="flex gap-4 font-mono text-[11px] text-white/60">
            <ExtLink href={P.cv}>yeni sekmede aç ↗</ExtLink>
            <a href={P.cv} download className="underline decoration-white/25 underline-offset-4 hover:text-white">
              indir ↓
            </a>
          </span>
        </div>
        <iframe
          title="Emin Onur Tuğran — CV"
          src={`${P.cv}#view=FitH&toolbar=0`}
          className="min-h-[380px] w-full flex-1 rounded-md border border-white/10 bg-white"
        />
      </div>
    );

  return (
    <div className="space-y-4">
      <Label>~/iletisim</Label>
      <h2 className="font-serif text-4xl leading-none text-white">Bağlantı kur.</h2>
      <ul className="divide-y divide-white/10 rounded-md border border-white/10 bg-[#0f121a] text-sm">
        {[
          ['E-posta', `mailto:${P.email}`, P.email, true],
          ['GitHub', P.github, 'github.com/OnurTugran'],
          ['LinkedIn', P.linkedin, 'linkedin.com/in/onur-tuğran'],
          ['TryHackMe', P.tryhackme, 'tryhackme.com/p/DiSSgusted'],
          ['HackTheBox', P.hackthebox, 'HTB profili'],
          ['CV', P.cv, 'Emin_Onur_Tugran_CV.pdf'],
        ]
          .filter(([, href]) => href)
          .map(([k, href, v, canCopy]) => (
            <li key={k} className="flex items-center justify-between gap-3 p-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{k}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <ExtLink href={href} className="truncate text-white/80">
                  {v}
                </ExtLink>
                {canCopy && (
                  <button
                    type="button"
                    onClick={copyEmail}
                    aria-label="E-posta adresini kopyala"
                    className="shrink-0 rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/75 transition hover:border-[#a78bfa]/60 hover:text-white"
                  >
                    {copied ? '✓ Kopyalandı' : 'Kopyala'}
                  </button>
                )}
              </span>
            </li>
          ))}
      </ul>
      <TryHackMeBadge />
    </div>
  );
}

// Canlı TryHackMe rozeti (ziyaretçinin tarayıcısında TryHackMe'den yüklenir; seviye/rütbe güncel kalır).
function TryHackMeBadge() {
  if (P.thmPublicId)
    return (
      <div>
        <Label>tryhackme</Label>
        <iframe
          title="TryHackMe rozeti"
          src={`https://tryhackme.com/api/v2/badges/public-profile?userPublicId=${P.thmPublicId}`}
          className="mt-3 h-[96px] w-full max-w-[340px] rounded-md border-0"
          loading="lazy"
        />
      </div>
    );
  return (
    <a
      href={P.tryhackme}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-4 rounded-md border border-[#9fef00]/20 bg-[#141c26] p-4 transition-colors hover:border-[#9fef00]/50"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#212c42] font-mono text-lg font-bold text-[#9fef00]">⚑</span>
      <span className="min-w-0">
        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">TryHackMe</span>
        <span className="block truncate text-white/85">DiSSgusted — odaları ve rozetleri gör ↗</span>
      </span>
    </a>
  );
}

function Browser({
  tab,
  project,
  navTo,
  back,
  forward,
  canBack,
  canForward,
  ws,
  active,
  onFocus,
  closed,
  minimized,
  maximized,
  onMinimize,
  onToggleMax,
  onClose,
  onRunDemo,
}) {
  const [filter, setFilter] = useState('all');
  const [refreshTick, setRefreshTick] = useState(0);
  const tabRefs = useRef({});

  const onTabKeyDown = (e) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    if (idx < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      const target = TABS[next].id;
      navTo(target, null);
      requestAnimationFrame(() => tabRefs.current[target]?.focus());
    }
  };

  return (
    <Win
      id="tarayici"
      ws={ws}
      active={active}
      onFocus={onFocus}
      label="Tarayıcı"
      closed={closed}
      minimized={minimized}
      maximized={maximized}
      onMinimize={onMinimize}
      onToggleMax={onToggleMax}
      onClose={onClose}
      className="left-[3%] right-[3%] top-10 h-[44%] sm:right-auto sm:left-[4%] sm:top-[9%] sm:h-[80%] sm:w-[58%] md:left-[10%] md:w-[52%]"
      bar={
        <div role="tablist" aria-label="Sekmeler" onKeyDown={onTabKeyDown} className="flex items-end gap-1 overflow-x-auto pt-1.5 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              data-tab
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => navTo(t.id, null)}
              className={`flex min-w-[84px] max-w-40 flex-1 items-center sm:min-w-0 gap-1.5 rounded-t-md px-2.5 py-1.5 text-left text-[11px] sm:text-xs ${
                tab === t.id ? 'bg-[#12141c] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tab === t.id ? 'bg-[var(--k-accent,#a78bfa)]' : 'bg-white/30'}`} />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-1.5 text-white/50">
        <span className="hidden items-center gap-1 text-sm sm:inline-flex">
          <button
            type="button"
            onClick={back}
            disabled={!canBack}
            aria-label="Geri"
            className="grid h-5 w-5 place-items-center rounded hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ←
          </button>
          <button
            type="button"
            onClick={forward}
            disabled={!canForward}
            aria-label="İleri"
            className="grid h-5 w-5 place-items-center rounded hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setRefreshTick((r) => r + 1)}
            aria-label="Yenile"
            className="grid h-5 w-5 place-items-center rounded hover:bg-white/10 hover:text-white"
          >
            ↻
          </button>
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded bg-black/40 px-2.5 py-1 font-mono text-[11px]">
          {Icon.lock}
          <span className="truncate">
            <span className="text-white/45">https://</span>
            <span className="text-white/80">{P.domain}</span>
            <span className="text-white/45">
              /{tab}
              {tab === 'projeler' && project ? `/${project}` : ''}
            </span>
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[#0b0d13] p-4 sm:p-8">
        {TABS.map((t) => (
          <div
            key={`${t.id}-${tab === t.id ? refreshTick : 0}`}
            id={`panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.id}`}
            hidden={tab !== t.id}
            className={tab === t.id ? 'k-fade' : ''}
          >
            <TabContent
              id={t.id}
              selectedProject={tab === 'projeler' ? project : null}
              onSelectProject={(name) => navTo('projeler', name)}
              filter={filter}
              setFilter={setFilter}
              onRunDemo={onRunDemo}
            />
          </div>
        ))}
      </div>
    </Win>
  );
}

// ─── Çalışma Alanı 2: Canlı SOC / Purple Lab penceresi ───
const SOC_SEED = [
  { ts: '17:10:41', side: 'red', mitre: 'T1046', msg: 'Stealth SYN burst → 10.0.13.37:22,443 (RST)', project: 'Stealth-TCP-SYN-Scanner' },
  { ts: '17:10:48', side: 'blue', mitre: 'T1078', msg: 'Isolation Forest outlier score=-0.78 (Event 4625)', project: 'Log-Analayzer' },
  { ts: '17:10:55', side: 'purple', mitre: 'T1190', msg: 'SSRF metadata egress test → WAF/allowlist doğrulandı', project: 'SSRF-Ghost' },
  { ts: '17:11:02', side: 'purple', mitre: 'T1593', msg: 'Pasif dork denetimi (.env / açık indeks kontrolü)', project: 'google-dork-auditor' },
  { ts: '17:11:09', side: 'red', mitre: 'T1059', msg: 'Outbound TCP soket oturumu :4444 (lab doğrulama)', project: 'BHP-Net-Tool' },
];
const SOC_POOL = [
  { side: 'red', mitre: 'T1046', msg: 'TCP half-open tarama algılandı (38 SYN/s)', project: 'Stealth-TCP-SYN-Scanner' },
  { side: 'blue', mitre: 'T1070', msg: 'Windows Security.evtx anomali skoru eşiği aşıldı', project: 'Log-Analayzer' },
  { side: 'purple', mitre: 'T1190', msg: 'Octal IP SSRF payload engellendi → kural aktif', project: 'SSRF-Ghost' },
  { side: 'blue', mitre: 'T1593', msg: 'Dork yüzey raporu güncellendi (0 kritik sızıntı)', project: 'google-dork-auditor' },
  { side: 'red', mitre: 'T1095', msg: 'Standart dışı port TCP/4444 heartbeat yakalandı', project: 'BHP-Net-Tool' },
  { side: 'purple', mitre: 'T1005', msg: 'Çevrimdışı dosya dönüşüm hattı doğrulandı (local)', project: 'omniverse' },
];
const KILL_CHAIN_PHASE = {
  'Stealth-TCP-SYN-Scanner': 'Keşif (T1046)',
  'google-dork-auditor': 'Keşif (T1593)',
  'SSRF-Ghost': 'İstismar (T1190)',
  'BHP-Net-Tool': 'C2 / Kanal (T1095)',
  'Log-Analayzer': 'Tespit (SIEM / ML)',
  omniverse: 'Yerel Araç',
};

function SocLab({ ws, active: isFocused, onFocus, theme, closed, minimized, maximized, onMinimize, onToggleMax, onClose, onOpenProject, onRunDemo }) {
  const [events, setEvents] = useState(SOC_SEED);
  const [pktRate, setPktRate] = useState(64);
  const [alertPulse, setAlertPulse] = useState(0);
  const tickRef = useRef(0);
  const simTimersRef = useRef([]);

  const active = ws === 2 && !closed && !minimized;

  useEffect(() => {
    if (!active) return undefined;
    const iv = setInterval(() => {
      const idx = tickRef.current++;
      const tpl = SOC_POOL[idx % SOC_POOL.length];
      const ts = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setEvents((prev) => [...prev.slice(-13), { ...tpl, ts }]);
      setPktRate(42 + ((idx * 19 + 23) % 76));
    }, 1500);
    return () => clearInterval(iv);
  }, [active]);

  useEffect(() => () => simTimersRef.current.forEach(clearTimeout), []);

  const simulateAttack = () => {
    simTimersRef.current.forEach(clearTimeout);
    simTimersRef.current = [];
    setAlertPulse((n) => n + 1);
    playAlertBlip();
    const nowTs = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const steps = [
      { delay: 0, side: 'red', mitre: 'T1190', msg: '[SIM] SSRF-Ghost octal bypass → 169.254.169.254', project: 'SSRF-Ghost', rate: 112 },
      { delay: 450, side: 'blue', mitre: 'T1078', msg: '[SIM] Log-Analayzer anomali yakaladı (skor -0.84)', project: 'Log-Analayzer', rate: 96 },
      { delay: 900, side: 'purple', mitre: 'RULE++', msg: '[SIM] Egress allowlist kuralı uygulandı — açık kapandı', project: 'SSRF-Ghost', rate: 58 },
    ];
    steps.forEach((st) => {
      const id = setTimeout(() => {
        setEvents((prev) => [...prev.slice(-13), { ts: nowTs(), side: st.side, mitre: st.mitre, msg: st.msg, project: st.project }]);
        setPktRate(st.rate);
      }, st.delay);
      simTimersRef.current.push(id);
    });
  };

  return (
    <Win
      id="soc"
      ws={ws}
      active={isFocused}
      onFocus={onFocus}
      label="SOC / Purple Lab"
      closed={closed}
      minimized={minimized}
      maximized={maximized}
      onMinimize={onMinimize}
      onToggleMax={onToggleMax}
      onClose={onClose}
      className="left-[3%] right-[3%] top-10 bottom-3 sm:left-[5%] sm:right-[5%] sm:top-[9%] sm:bottom-[5%]"
      bar={<p className="truncate py-1.5 text-center font-mono text-[11px] text-white/55">SOC / Purple Lab — eth0 canlı telemetri</p>}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0e111a] px-3.5 py-2 font-mono text-[11px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[#6effbe]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#6effbe] shadow-[0_0_8px_#6effbe]" />
            SENSOR: eth0 · LIVE
          </span>
          <span className="text-white/55">{pktRate} pkt/s</span>
          <span className="hidden text-white/55 sm:inline">Kurallar: 6/6 aktif</span>
        </div>
        <button
          type="button"
          onClick={simulateAttack}
          className="rounded border border-[#ff4d7d]/45 bg-[#ff4d7d]/15 px-2.5 py-1 text-[10.5px] text-[#ff9bb6] transition hover:bg-[#ff4d7d]/25 hover:text-white"
        >
          ⚡ Saldırı Simüle Et
        </button>
      </div>

      <SocWaveform active={active} alertPulse={alertPulse} theme={theme} />

      <div className="grid min-h-0 flex-1 divide-y divide-white/10 overflow-hidden lg:grid-cols-[1.25fr_1fr] lg:divide-x lg:divide-y-0">
        {/* Sol: canlı tshark / SIEM tespit akışı */}
        <div className="flex min-h-0 flex-col bg-[#0a0c12] p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Canlı Paket &amp; SIEM Akışı (tıkla → vaka)</p>
          <div className="k-scroll min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 font-mono text-[11px]">
            {events.map((ev, i) => (
              <button
                key={`${ev.ts}-${i}`}
                type="button"
                onClick={() => onOpenProject(ev.project)}
                className="flex w-full items-baseline gap-2 rounded border border-transparent px-2 py-1 text-left transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                <span className="shrink-0 text-white/40">{ev.ts}</span>
                <span
                  className={`w-12 shrink-0 text-[10px] uppercase ${
                    ev.side === 'red' ? 'text-[#ff8a8a]' : ev.side === 'blue' ? 'text-[#8ab4ff]' : 'text-[#c4a1ff]'
                  }`}
                >
                  {ev.side}
                </span>
                <span className="shrink-0 rounded bg-white/[0.06] px-1 text-[10px] text-white/75">{ev.mitre}</span>
                <span className="min-w-0 flex-1 truncate text-white/80">{ev.msg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sağ: Kill Chain & Araç Haritası */}
        <div className="flex min-h-0 flex-col bg-[#0c0f17] p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Kill Chain &amp; Araç Haritası</p>
          <div className="k-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {PROJECTS.map((p) => (
              <div key={p.name} className="rounded border border-white/10 bg-[#10141f] p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-xs text-white">{p.name}</span>
                  <span className={`font-mono text-[10px] ${SIDE[p.side].tone}`}>{KILL_CHAIN_PHASE[p.name] ?? SIDE[p.side].label}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-white/55">{p.text}</p>
                <div className="mt-2 flex gap-2 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => onOpenProject(p.name)}
                    className="rounded border border-white/15 bg-white/[0.04] px-2 py-0.5 text-white/80 hover:border-white/30 hover:text-white"
                  >
                    Vaka ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => onRunDemo(p.demoCmd)}
                    className="rounded border border-[#a78bfa]/35 bg-[#a78bfa]/15 px-2 py-0.5 text-[#d9c8ff] hover:bg-[#a78bfa]/25 hover:text-white"
                  >
                    Demo ▶
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Win>
  );
}

// ─── Masaüstü ikonları (md+): tıklanınca ilgili sekme/pencere; aktif bölüm seçili görünür ───
function DesktopIcons({ tab, openTab, focusTerminal }) {
  const items = [
    { label: 'Ev', icon: Icon.home, tab: 'hakkimda' },
    { label: 'Projeler', icon: Icon.folderLg, tab: 'projeler' },
    { label: 'Yetkinlikler', icon: Icon.folderLg, tab: 'yetkinlikler' },
    ...(P.cv ? [{ label: 'CV.pdf', icon: Icon.file, tab: 'cv' }] : []),
    { label: 'iletisim.txt', icon: Icon.file, tab: 'iletisim' },
    { label: 'Terminal', icon: Icon.terminalLg, onClick: focusTerminal },
  ];
  return (
    <nav aria-label="Masaüstü" className="absolute left-2 top-12 z-[5] hidden w-[8%] min-w-[72px] max-w-[96px] flex-col gap-1 md:flex">
      {items.map((it) => {
        const active = it.tab && it.tab === tab;
        return (
          <button
            key={it.label}
            type="button"
            data-icon
            onClick={it.onClick ?? (() => openTab(it.tab))}
            className={`flex flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[11px] leading-tight transition-colors duration-300 ${
              active ? 'bg-[#367bf0]/25 text-white ring-1 ring-[#6f9cff]/50' : 'text-white/75 hover:bg-white/10'
            }`}
          >
            <span className={active ? 'text-[#9cc0ff]' : 'text-white/80'}>{it.icon}</span>
            <span className="max-w-full truncate [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Ana bileşen ───
const WINDOW_IDS = ['tarayici', 'soc', 'topology', 'hud', ...TERMINALS.map((t) => t.id)];
const WORKSPACE_LABELS = { 1: 'Portfolyo', 2: 'SOC Lab', 3: 'Ağ Topolojisi', 4: 'Cyber HUD' };

const makeInitialWhere = () => {
  const phone = typeof window !== 'undefined' && window.innerWidth < 640;
  return Object.fromEntries(
    WINDOW_IDS.map((id) => [
      id,
      id === 'soc' ? 2 : id === 'topology' ? 3 : id === 'hud' ? 4 : phone && id !== 'tarayici' && id !== 't1' ? undefined : 1,
    ]),
  );
};

const KaliDesktop = forwardRef(function KaliDesktop(_props, ref) {
  const [nav, setNav] = useState({
    history: [{ tab: 'hakkimda', project: null }],
    idx: 0,
  });
  const curNav = nav.history[nav.idx];
  const tab = curNav.tab;
  const project = curNav.project;

  const [ws, setWs] = useState(1);
  const [where, setWhere] = useState(makeInitialWhere);
  const [minimized, setMinimized] = useState({});
  const [maximized, setMaximized] = useState({});
  const [activeWin, setActiveWin] = useState('tarayici');
  const [themeId, setThemeId] = useState('purple');
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [locked, setLocked] = useState(false);
  const [sfxOn, setSfxOn] = useState(() => isSfxEnabled());
  const [siemToast, setSiemToast] = useState(false);
  const [ctfSolved, setCtfSolved] = useState(false);
  const [ctfOpen, setCtfOpen] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [execReq, setExecReq] = useState(null);

  const rootRef = useRef(null);
  const layerRef = useRef(null);
  const menuRef = useRef(null);
  const ctxMenuRef = useRef(null);
  const prevWs = useRef(1);
  const siemShownRef = useRef(false);
  const themeObj = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => subscribeSfx(setSfxOn), []);

  const setRefs = (el) => {
    rootRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  const front = (id) => {
    bringToFront(rootRef.current?.querySelector(`[data-win="${id}"]`));
    setActiveWin(id);
  };
  const isOpen = (id) => where[id] === ws;

  const openWin = (id) => {
    setWhere((w) => ({ ...w, [id]: ws }));
    setMinimized((m) => (m[id] ? { ...m, [id]: false } : m));
    requestAnimationFrame(() => front(id));
  };
  const jumpWorkspaceWin = (targetWs, winId) => {
    setWhere((w) => ({ ...w, [winId]: targetWs }));
    setMinimized((m) => ({ ...m, [winId]: false }));
    setWs(targetWs);
    setMenuOpen(false);
    setCtxMenu(null);
    requestAnimationFrame(() => front(winId));
  };
  const close = (id) => {
    setWhere((w) => ({ ...w, [id]: undefined }));
    setMinimized((m) => ({ ...m, [id]: false }));
    setMaximized((m) => ({ ...m, [id]: false }));
  };
  const toggleMin = (id) => setMinimized((m) => ({ ...m, [id]: !m[id] }));
  const toggleMax = (id) => {
    setMaximized((m) => ({ ...m, [id]: !m[id] }));
    requestAnimationFrame(() => front(id));
  };

  const navTo = (nextTab, nextProject = null) => {
    setNav((s) => {
      const cur = s.history[s.idx];
      if (cur.tab === nextTab && cur.project === nextProject) return s;
      const sliced = s.history.slice(0, s.idx + 1);
      return { history: [...sliced, { tab: nextTab, project: nextProject }], idx: sliced.length };
    });
  };
  const back = () => setNav((s) => (s.idx > 0 ? { ...s, idx: s.idx - 1 } : s));
  const forward = () => setNav((s) => (s.idx < s.history.length - 1 ? { ...s, idx: s.idx + 1 } : s));

  const openTab = (id, proj = null) => {
    navTo(id, proj);
    openWin('tarayici');
  };
  const openProjectInWs1 = (projName) => {
    setWs(1);
    navTo('projeler', projName);
    setWhere((w) => ({ ...w, tarayici: 1 }));
    setMinimized((m) => ({ ...m, tarayici: false }));
    requestAnimationFrame(() => front('tarayici'));
  };
  // Terminal simgesi: bu alanda henüz açık olmayan ilk terminali açar.
  const openTerminal = () => openWin(TERMINALS.find((t) => !isOpen(t.id))?.id ?? TERMINALS[0].id);

  const runInTerminal = (cmd) => {
    setWs(1);
    setWhere((w) => ({ ...w, t1: 1 }));
    setMinimized((m) => ({ ...m, t1: false }));
    setExecReq((prev) => ({ seq: (prev?.seq ?? 0) + 1, cmd }));
    requestAnimationFrame(() => front('t1'));
  };

  const resetDesktop = () => {
    setWs(1);
    setWhere(makeInitialWhere());
    setMinimized({});
    setMaximized({});
    setMenuOpen(false);
    setCtxMenu(null);
    setActiveWin('tarayici');
    navTo('hakkimda', null);
  };

  const triggerGlitch = () => {
    playStaticTick();
    setGlitching(true);
    setTimeout(() => setGlitching(false), 380);
  };

  const selectTheme = (id) => {
    setThemeId(id);
    playUiChime();
  };

  // Açılışta SIEM CRT-01 bildirimi
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    let hideTimer;
    const onNotify = () => {
      if (siemShownRef.current) return;
      siemShownRef.current = true;
      setSiemToast(true);
      hideTimer = setTimeout(() => setSiemToast(false), 8500);
    };
    el.addEventListener('kali-siem-notify', onNotify);
    return () => {
      el.removeEventListener('kali-siem-notify', onNotify);
      clearTimeout(hideTimer);
    };
  }, []);

  // Whisker menüsü & sağ-tık menüsü dışarı tık / Esc ile kapanır
  useEffect(() => {
    if (!menuOpen && !ctxMenu) return undefined;
    const onDown = (e) => {
      if (menuOpen && !menuRef.current?.contains(e.target)) setMenuOpen(false);
      if (ctxMenu && !ctxMenuRef.current?.contains(e.target)) setCtxMenu(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setCtxMenu(null);
      }
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, ctxMenu]);

  // Çalışma alanı değişince pencereler yana kayarak gelir (Linux'taki gibi).
  useEffect(() => {
    const dir = Math.sign(ws - prevWs.current);
    prevWs.current = ws;
    if (!dir || !layerRef.current) return;
    gsap.fromTo(layerRef.current, { xPercent: dir * 6, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' });
  }, [ws]);

  const tasks = [
    { id: 'tarayici', label: 'Tarayıcı', icon: Icon.globe },
    { id: 'soc', label: 'SOC / Purple Lab', icon: Icon.shield },
    { id: 'topology', label: 'Ağ Topolojisi', icon: Icon.network },
    { id: 'hud', label: 'Cyber HUD', icon: Icon.cpu },
    ...TERMINALS.map((t) => ({ id: t.id, label: t.title, icon: Icon.terminal })),
  ].filter((t) => isOpen(t.id));
  const busy = (n) => WINDOW_IDS.some((id) => where[id] === n);

  const onDesktopContextMenu = (e) => {
    if (e.target.closest('[data-win], [data-k="panel"], button, a, input, [role="menu"]')) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    const x = clamp(e.clientX - rect.left, 8, Math.max(8, rect.width - 236));
    const y = clamp(e.clientY - rect.top, 40, Math.max(40, rect.height - 290));
    setMenuOpen(false);
    setCtxMenu({ x, y });
  };

  return (
    <div
      ref={setRefs}
      style={{
        '--k-accent': themeObj.accent,
        '--k-accent-2': themeObj.accent2,
        '--k-accent-rgb': themeObj.accentRgb,
      }}
      className={`absolute inset-0 overflow-hidden bg-black font-sans text-white ${glitching ? 'k-glitch' : ''}`}
      aria-label="Kali Linux masaüstü"
    >
      <Wallpaper theme={themeObj} />

      <div data-k="desktop" onContextMenu={onDesktopContextMenu} className="absolute inset-0">
        <div data-k="panel" className="relative z-[60] flex h-8 items-center gap-2 bg-[#14161d]/95 px-2 text-white/70 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setCtxMenu(null);
                setMenuOpen((o) => !o);
              }}
              aria-label="Kali menüsü"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={`grid h-7 w-7 place-items-center rounded transition ${menuOpen ? 'bg-white/15' : 'hover:bg-white/10'}`}
            >
              <img src={`${import.meta.env.BASE_URL}assets/kali_dragon.png`} alt="" className="h-7 w-7" draggable="false" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="Kali Whisker Menüsü"
                className="k-toast absolute left-0 top-9 z-[70] w-64 overflow-hidden rounded-lg border border-white/15 bg-[#12151f]/95 p-2 text-xs text-white/85 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md"
              >
                <div className="border-b border-white/10 px-2 pb-2 pt-1">
                  <p className="font-mono text-[11px] font-bold text-white">
                    {P.user}@{P.host}
                  </p>
                  <p className="font-mono text-[10px] text-white/45">Purple Team Workstation</p>
                </div>

                <div className="mt-2 space-y-0.5">
                  <p className="px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/40">Portfolyo</p>
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        openTab(t.id, null);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-[#367bf0]/25 hover:text-white"
                    >
                      <span>{t.label}</span>
                      <span className="font-mono text-[10px] text-white/40">/{t.id}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2">
                  <p className="px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/40">Laboratuvar &amp; Görsel Alanlar</p>
                  {TERMINALS.map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        openWin(term.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-[11px] hover:bg-[#367bf0]/25 hover:text-white"
                    >
                      {Icon.terminal}
                      <span className="truncate">{term.title}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => jumpWorkspaceWin(2, 'soc')}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-[#6effbe] hover:bg-[#6effbe]/15"
                  >
                    <span className="inline-flex items-center gap-2">
                      {Icon.shield}
                      <span>SOC / Purple Lab</span>
                    </span>
                    <span className="text-[10px] text-white/45">Alan 2</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => jumpWorkspaceWin(3, 'topology')}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-[#5ee6ff] hover:bg-[#5ee6ff]/15"
                  >
                    <span className="inline-flex items-center gap-2">
                      {Icon.network}
                      <span>Ağ Topolojisi</span>
                    </span>
                    <span className="text-[10px] text-white/45">Alan 3</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => jumpWorkspaceWin(4, 'hud')}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-[#c4a1ff] hover:bg-[#a78bfa]/20"
                  >
                    <span className="inline-flex items-center gap-2">
                      {Icon.cpu}
                      <span>Cyber HUD &amp; MITRE</span>
                    </span>
                    <span className="text-[10px] text-white/45">Alan 4</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      runInTerminal('ls -la');
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-[#fbbf24] hover:bg-[#fbbf24]/15"
                  >
                    <span>Mini-CTF Başlat</span>
                    <span>⚑</span>
                  </button>
                </div>

                <div className="mt-2 border-t border-white/10 pt-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/40">Tema</span>
                    <span className="flex items-center gap-1.5">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectTheme(t.id)}
                          aria-label={`Tema: ${t.label}`}
                          title={t.label}
                          className={`h-3 w-3 rounded-full border transition ${themeId === t.id ? 'scale-125 border-white' : 'border-white/25 opacity-75 hover:opacity-100'}`}
                          style={{ backgroundColor: t.accent }}
                        />
                      ))}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setLocked(true);
                      playUiChime();
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    <span>Ekranı Kilitle</span>
                    {Icon.lock}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={resetDesktop}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-mono text-[11px] text-white/65 hover:bg-white/10 hover:text-white"
                  >
                    <span>Masaüstünü Sıfırla</span>
                    <span>↺</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="flex items-center gap-0.5 sm:gap-1">
            <button type="button" onClick={() => openTab('projeler', null)} aria-label="Dosyalar" className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
              {Icon.folder}
            </button>
            <button type="button" onClick={openTerminal} aria-label="Terminal aç" className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
              {Icon.terminal}
            </button>
            <button type="button" onClick={() => openTab(tab, project)} aria-label="Tarayıcı aç" className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
              {Icon.globe}
            </button>
          </span>
          {/* Çalışma alanları: tıklayınca geçilir; içinde pencere olanların altında çizgi. */}
          <span className="flex items-center gap-0.5 font-mono text-[10px]" role="group" aria-label="Çalışma alanları">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setWs(n);
                  const defaultWin = { 1: 'tarayici', 2: 'soc', 3: 'topology', 4: 'hud' }[n];
                  if (defaultWin && where[defaultWin] === n) setActiveWin(defaultWin);
                }}
                aria-pressed={n === ws}
                aria-label={`Çalışma alanı ${n}: ${WORKSPACE_LABELS[n]}`}
                title={`Alan ${n}: ${WORKSPACE_LABELS[n]}`}
                style={n === ws ? { backgroundColor: themeObj.accent } : undefined}
                className={`relative grid h-5 w-5 place-items-center rounded-sm transition-colors duration-200 ${
                  n === ws ? 'text-white shadow-[0_0_12px_-2px_var(--k-accent)]' : 'bg-white/5 hover:bg-white/15'
                }`}
              >
                {n}
                {busy(n) && n !== ws && <span className="absolute bottom-0.5 h-[2px] w-2 rounded bg-white/60" />}
              </button>
            ))}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                data-task={t.id}
                aria-label={`${t.label} penceresini öne getir`}
                title={t.label}
                onClick={() => {
                  if (minimized[t.id]) toggleMin(t.id);
                  requestAnimationFrame(() => front(t.id));
                }}
                className={`flex min-w-0 max-w-44 items-center gap-1.5 rounded px-2 py-1 text-[11px] transition hover:bg-white/10 ${
                  minimized[t.id] ? 'bg-white/[0.03] text-white/45' : activeWin === t.id ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/80'
                }`}
              >
                {t.icon}
                <span className="hidden truncate md:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 pl-1 text-xs sm:gap-2.5">
            {ctfSolved && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCtfOpen((o) => !o)}
                  className="inline-flex items-center gap-1 rounded border border-[#6effbe]/40 bg-[#6effbe]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#6effbe] hover:bg-[#6effbe]/25"
                >
                  ⚑ CTF
                </button>
                {ctfOpen && (
                  <div className="k-toast absolute right-0 top-7 z-[70] w-64 rounded-lg border border-[#6effbe]/30 bg-[#10151e]/95 p-3 text-xs shadow-2xl backdrop-blur-md">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6effbe]">Incident Contained</p>
                    <p className="mt-1.5 text-white/80">
                      CRT-01 anomalisi çözüldü. Güncel staj/iletişim bilgileri için hızlı bağlantılar:
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          openTab('iletisim', null);
                          setCtfOpen(false);
                        }}
                        className="rounded bg-[#367bf0] px-2.5 py-1 text-white hover:bg-[#498af3]"
                      >
                        İletişim
                      </button>
                      {P.cv && (
                        <button
                          type="button"
                          onClick={() => {
                            openTab('cv', null);
                            setCtfOpen(false);
                          }}
                          className="rounded border border-white/20 px-2.5 py-1 text-white/85 hover:bg-white/10"
                        >
                          CV
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Mini canlı CPU/NET ekolayzer */}
            <span className="hidden h-3.5 items-end gap-[2px] md:inline-flex" title="CPU / NET Telemetri" aria-hidden="true">
              {[0.55, 0.9, 0.4, 0.75, 0.95, 0.5].map((h, i) => (
                <span
                  key={i}
                  className="k-eq-bar w-[2px] rounded-full"
                  style={{
                    height: `${Math.round(h * 12)}px`,
                    backgroundColor: themeObj.accent,
                    animationDelay: `${(i * 0.14).toFixed(2)}s`,
                    animationDuration: `${(0.85 + (i % 3) * 0.25).toFixed(2)}s`,
                  }}
                />
              ))}
            </span>
            {/* 4 Modlu Tema Seçici */}
            <span className="hidden items-center gap-1 sm:inline-flex" role="group" aria-label="Görsel tema">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTheme(t.id)}
                  aria-label={`Tema: ${t.label}`}
                  aria-pressed={themeId === t.id}
                  title={`Tema: ${t.label}`}
                  className={`h-2.5 w-2.5 cursor-pointer rounded-full border transition ${
                    themeId === t.id ? 'scale-125 border-white shadow-[0_0_8px_currentColor]' : 'border-white/25 opacity-65 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: t.accent, color: t.accent }}
                />
              ))}
            </span>
            {/* Senkron SFX anahtarı */}
            <button
              type="button"
              onClick={() => toggleSfx()}
              aria-pressed={sfxOn}
              aria-label={sfxOn ? 'Ses efektlerini kapat' : 'Ses efektlerini aç'}
              title={`SFX: ${sfxOn ? 'Açık' : 'Kapalı'}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9.5px] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sfxOn ? 'bg-[#6effbe] shadow-[0_0_6px_#6effbe]' : 'bg-white/30'}`} />
              <span className="hidden sm:inline">SFX</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLocked(true);
                playUiChime();
              }}
              aria-label="Ekranı kilitle"
              title="Ekranı kilitle"
              className="grid h-6 w-6 cursor-pointer place-items-center rounded text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              {Icon.lock}
            </button>
            <span className="hidden sm:inline">{Icon.wifi}</span>
            <Clock />
          </span>
        </div>

        {/* XFCE SIEM Bildirimi (CRT-01 → Masaüstü köprüsü) */}
        {siemToast && (
          <div
            role="status"
            className="k-toast absolute right-3 top-10 z-[55] w-[290px] rounded-lg border border-[#ff4d7d]/35 bg-[#12151f]/95 p-3 text-xs shadow-[0_18px_40px_rgba(0,0,0,0.8)] backdrop-blur-md sm:w-[330px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ff4d7d] shadow-[0_0_8px_#ff4d7d]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff8aa8]">SIEM · CRT-01</span>
              </div>
              <button
                type="button"
                onClick={() => setSiemToast(false)}
                aria-label="Bildirimi kapat"
                className="text-white/50 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-1.5 leading-relaxed text-white/80">
              <code className="font-mono text-[#c4a1ff]">fsociety00.dat</code> anomalisi algılandı —{' '}
              <code className="font-mono text-white/90">~/.auth.log</code> incele.
            </p>
            <button
              type="button"
              onClick={() => {
                setSiemToast(false);
                runInTerminal('ls -la');
              }}
              className="mt-2 font-mono text-[11px] text-[#8ab4ff] underline decoration-white/25 underline-offset-4 hover:text-white"
            >
              Terminalde İncele →
            </button>
          </div>
        )}

        {/* Masaüstü sağ-tık XFCE bağlam menüsü */}
        {ctxMenu && (
          <div
            ref={ctxMenuRef}
            role="menu"
            aria-label="Masaüstü menüsü"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            className="k-toast absolute z-[75] w-56 overflow-hidden rounded-lg border border-white/15 bg-[#111420]/95 p-1.5 font-mono text-[11px] text-white/85 shadow-[0_22px_55px_rgba(0,0,0,0.88)] backdrop-blur-md"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                runInTerminal('neofetch');
                setCtxMenu(null);
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left hover:bg-white/10 hover:text-white"
            >
              <span>Terminal (neofetch)</span>
              {Icon.terminal}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => jumpWorkspaceWin(2, 'soc')}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[#6effbe] hover:bg-[#6effbe]/15"
            >
              <span>SOC / Purple Lab</span>
              <span className="text-[10px] text-white/45">Alan 2</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => jumpWorkspaceWin(3, 'topology')}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[#5ee6ff] hover:bg-[#5ee6ff]/15"
            >
              <span>Ağ Topolojisi</span>
              <span className="text-[10px] text-white/45">Alan 3</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => jumpWorkspaceWin(4, 'hud')}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[#c4a1ff] hover:bg-[#a78bfa]/15"
            >
              <span>Cyber HUD &amp; MITRE</span>
              <span className="text-[10px] text-white/45">Alan 4</span>
            </button>
            <div className="my-1 border-t border-white/10" />
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Tema</span>
              <span className="flex items-center gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTheme(t.id)}
                    aria-label={`Tema: ${t.label}`}
                    title={t.label}
                    className={`h-3 w-3 rounded-full border transition ${themeId === t.id ? 'scale-125 border-white' : 'border-white/25 opacity-75 hover:opacity-100'}`}
                    style={{ backgroundColor: t.accent }}
                  />
                ))}
              </span>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setCtxMenu(null);
                triggerGlitch();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[#ff9bb6] hover:bg-[#ff4d7d]/15"
            >
              <span>Glitch Efekt Testi</span>
              <span>⚡</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setCtxMenu(null);
                setLocked(true);
                playUiChime();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left hover:bg-white/10 hover:text-white"
            >
              <span>Ekranı Kilitle</span>
              {Icon.lock}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={resetDesktop}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-white/65 hover:bg-white/10 hover:text-white"
            >
              <span>Masaüstünü Sıfırla</span>
              <span>↺</span>
            </button>
          </div>
        )}

        <DesktopIcons tab={isOpen('tarayici') ? tab : null} openTab={(id) => openTab(id, null)} focusTerminal={openTerminal} />

        <div ref={layerRef} className="pointer-events-none absolute inset-0 isolate z-10 [&>*]:pointer-events-auto">
          <Browser
            tab={tab}
            project={project}
            navTo={navTo}
            back={back}
            forward={forward}
            canBack={nav.idx > 0}
            canForward={nav.idx < nav.history.length - 1}
            ws={ws}
            active={activeWin === 'tarayici'}
            onFocus={setActiveWin}
            closed={!isOpen('tarayici')}
            minimized={!!minimized.tarayici}
            maximized={!!maximized.tarayici}
            onMinimize={() => toggleMin('tarayici')}
            onToggleMax={() => toggleMax('tarayici')}
            onClose={() => close('tarayici')}
            onRunDemo={runInTerminal}
          />
          <SocLab
            ws={ws}
            active={activeWin === 'soc'}
            onFocus={setActiveWin}
            theme={themeObj}
            closed={!isOpen('soc')}
            minimized={!!minimized.soc}
            maximized={!!maximized.soc}
            onMinimize={() => toggleMin('soc')}
            onToggleMax={() => toggleMax('soc')}
            onClose={() => close('soc')}
            onOpenProject={openProjectInWs1}
            onRunDemo={runInTerminal}
          />
          <Win
            id="topology"
            ws={ws}
            active={activeWin === 'topology'}
            onFocus={setActiveWin}
            label="Ağ Topolojisi & Saldırı Haritası"
            closed={!isOpen('topology')}
            minimized={!!minimized.topology}
            maximized={!!maximized.topology}
            onMinimize={() => toggleMin('topology')}
            onToggleMax={() => toggleMax('topology')}
            onClose={() => close('topology')}
            className="left-[3%] right-[3%] top-10 bottom-3 sm:left-[5%] sm:right-[5%] sm:top-[9%] sm:bottom-[5%]"
            bar={<p className="truncate py-1.5 text-center font-mono text-[11px] text-white/55">Ağ Topolojisi — Canlı Saldırı &amp; Savunma Haritası</p>}
          >
            <CyberTopology
              active={isOpen('topology') && !minimized.topology}
              theme={themeObj}
              onOpenProject={openProjectInWs1}
              onRunDemo={runInTerminal}
              onActionTone={playUiChime}
            />
          </Win>
          <Win
            id="hud"
            ws={ws}
            active={activeWin === 'hud'}
            onFocus={setActiveWin}
            label="Cyber HUD & MITRE ATT&CK Matrisi"
            closed={!isOpen('hud')}
            minimized={!!minimized.hud}
            maximized={!!maximized.hud}
            onMinimize={() => toggleMin('hud')}
            onToggleMax={() => toggleMax('hud')}
            onClose={() => close('hud')}
            className="left-[3%] right-[3%] top-10 bottom-3 sm:left-[5%] sm:right-[5%] sm:top-[9%] sm:bottom-[5%]"
            bar={<p className="truncate py-1.5 text-center font-mono text-[11px] text-white/55">Cyber HUD — Sistem Telemetrisi &amp; MITRE ATT&amp;CK</p>}
          >
            <CyberHud active={isOpen('hud') && !minimized.hud} theme={themeObj} onOpenProject={openProjectInWs1} />
          </Win>
          {TERMINALS.map((t) => (
            <Terminal
              key={t.id}
              t={t}
              ws={ws}
              active={activeWin === t.id}
              onFocus={setActiveWin}
              closed={!isOpen(t.id)}
              minimized={!!minimized[t.id]}
              maximized={!!maximized[t.id]}
              onMinimize={() => toggleMin(t.id)}
              onToggleMax={() => toggleMax(t.id)}
              onClose={() => close(t.id)}
              openTab={(tabId) => openTab(tabId, null)}
              execReq={t.id === 't1' ? execReq : null}
              onCtfSolve={() => setCtfSolved(true)}
              onTriggerGlitch={triggerGlitch}
            />
          ))}
        </div>

        {locked && <LockScreen theme={themeObj} onUnlock={() => setLocked(false)} />}
      </div>
    </div>
  );
});

export default KaliDesktop;
export { TABS };

// ─── Scroll timeline'ı: masaüstü kaydırdıkça açılır ───
// Siyah ekran → duvar kağıdı → panel, simgeler → pencereler açılır → terminaller komutlarını yazar.
// Sekmeler ve 1–4 çalışma alanları scroll'la değişmez; onlar tıklamayla.
export function addDesktopScroll(tl, root) {
  const q = (s) => root.querySelector(s);
  const qa = (s) => [...root.querySelectorAll(s)];
  const wall = q('[data-k="wall"]');
  const panel = q('[data-k="panel"]');
  const win = (id) => q(`[data-win="${id}"]`);
  const termInput = q('[data-term-input]');

  // Sadece başlangıçta (Alan 1'de) açık olan pencereler scroll timeline'ına dahil edilir;
  // Alan 2'deki SOC penceresi çalışma alanı değiştirilince doğrudan görünür.
  const isStartOpen = (id) => !!q(`[data-task="${id}"]`);
  const startWins = WINDOW_IDS.filter(isStartOpen).map(win).filter(Boolean);
  gsap.set(wall, { autoAlpha: 0, scale: 1.12 });
  gsap.set(panel, { yPercent: -100 });
  gsap.set(qa('[data-icon]'), { autoAlpha: 0, x: -14 });
  gsap.set(startWins, { autoAlpha: 0, scale: 0.94, y: 18 });
  gsap.set(qa('[data-task]'), { autoAlpha: 0 });
  if (termInput) gsap.set(termInput, { display: 'none' });
  TERMINALS.filter((t) => isStartOpen(t.id)).forEach((t) => gsap.set(win(t.id).querySelectorAll('[data-line]'), { display: 'none' }));

  // Satırları sırayla göster; komutlar harf harf yazılır; terminal en alta kaydırılır.
  const type = (id, pos) => {
    const body = win(id).querySelector('[data-term-body]');
    const toBottom = () => (body.scrollTop = body.scrollHeight);
    [...win(id).querySelectorAll('[data-line]')].forEach((line, i) => {
      const typed = line.querySelector('[data-type]');
      tl.set(line, { display: '' }, i === 0 ? pos : '>+0.08');
      tl.call(toBottom, null, '>');
      if (typed) {
        const n = typed.textContent.length;
        tl.fromTo(typed, { width: '0ch' }, { width: `${n}ch`, duration: n * 0.04, ease: `steps(${n})` }, '>');
      }
    });
    if (id === 't1' && termInput) {
      tl.set(termInput, { display: '' }, '>+0.08');
      tl.call(toBottom, null, '>');
    }
  };
  const open = (id, pos) => {
    if (!q(`[data-task="${id}"]`)) return; // bu cihazda başlangıçta kapalı pencere
    tl.to(win(id), { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.3)' }, pos);
    tl.to(q(`[data-task="${id}"]`), { autoAlpha: 1, duration: 0.2 }, '<');
  };

  // Siyahtan yavaşça doğar (giriş ekranı da siyaha karardı → dikişsiz geçiş).
  tl.to(wall, { autoAlpha: 1, duration: 2.4, ease: 'power1.inOut' }, 0.2);
  tl.to(wall, { scale: 1, duration: 3.4, ease: 'power2.out' }, 0.2);
  tl.to(panel, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 1.8);
  tl.to(qa('[data-icon]'), { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, 2.1);

  open('tarayici', 2.8);
  TERMINALS.filter((t) => isStartOpen(t.id)).forEach(({ id }, n) => {
    open(id, n ? '>+0.1' : '>+0.2');
    type(id, '>');
  });
  tl.to({}, { duration: 1 });
}
