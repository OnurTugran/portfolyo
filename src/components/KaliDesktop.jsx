import { forwardRef, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ProjectCover from './ProjectCover.jsx';

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
  },
  {
    name: 'google-dork-auditor',
    side: 'purple',
    text: 'Google dork sorgularıyla hassas veri sızıntılarını tespit eden GUI/CLI OSINT denetim aracı.',
    tags: ['Python', 'OSINT', 'GUI/CLI'],
  },
  {
    name: 'Stealth-TCP-SYN-Scanner',
    side: 'red',
    text: 'Scapy tabanlı, SYN paketleriyle çalışan gizli (stealth) port tarayıcı.',
    tags: ['Python', 'Scapy', 'Ağ keşfi'],
  },
  {
    name: 'BHP-Net-Tool',
    side: 'red',
    text: 'Socket programlama ve threading üzerine kurulu, eğitim amaçlı Netcat klonu.',
    tags: ['Python', 'Socket', 'Threading'],
  },
  {
    name: 'Log-Analayzer',
    side: 'blue',
    text: 'Windows sistem loglarını Isolation Forest ile analiz eden anomali tespit aracı.',
    tags: ['Python', 'Isolation Forest', 'Log analizi'],
  },
  {
    name: 'omniverse',
    side: 'tool',
    text: 'Dosya dönüştürücü, sıkıştırıcı, PDF birleştirici ve medya indirici (Windows, PyQt6).',
    tags: ['Python', 'PyQt6', 'Masaüstü'],
  },
];

// ch: eski scroll bölümü bilgisi (artık kullanılmıyor).
const TERMINALS = [
  {
    id: 't1',
    title: `${P.user}@${P.host}: ~`,
    pos: 'left-[3%] right-[3%] top-[52%] max-sm:max-h-[42%] sm:left-auto sm:right-[3%] sm:top-[11%] sm:w-[34%]',
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
    pos: 'left-[4%] right-[7%] top-[59%] sm:left-auto sm:right-[5%] sm:top-[40%] sm:w-[37%]',
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
      { out: '# psst… klavyede f-s-o-c-i-e-t-y yaz.', dim: true },
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
  dragon: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 17c3-1 5-4 6-8 1 3 3 4 6 4-2 1-3 3-3 6" />
      <path d="M10 9c1-3 3-5 7-5" />
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
};

// Duvar kağıdı: Kali-Hack görseli (orijinal 3840×2160 → web için 2560×1440).
// Üstüne hafif karartma: pencerelerin okunurluğu bozulmasın.
export function Wallpaper() {
  return (
    <div data-k="wall" className="absolute inset-0 bg-black" aria-hidden="true">
      <img
        src={`${import.meta.env.BASE_URL}assets/kali_hack_duvar.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

// ─── Pencere çerçevesi: başlık çubuğundan sürüklenir, tıklanınca öne gelir ───
function Win({ id, className, closed, onClose, bar, children, label }) {
  const ref = useRef(null);
  const off = useRef({ x: 0, y: 0 });

  // Görünür olunca (yeniden açılınca / çalışma alanına dönülünce) hafifçe büyüyerek belirir.
  // İlk açılışı scroll timeline'ı yapar, o yüzden ilk render atlanır.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (closed || !ref.current) return;
    bringToFront(ref.current);
    gsap.fromTo(ref.current, { autoAlpha: 0, scale: 0.95, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)' });
  }, [closed]);

  const startDrag = (e) => {
    if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('button, a, input')) return;
    const el = ref.current;
    const sx = e.clientX - off.current.x;
    const sy = e.clientY - off.current.y;
    const move = (ev) => {
      off.current = { x: ev.clientX - sx, y: ev.clientY - sy };
      el.style.translate = `${off.current.x}px ${off.current.y}px`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <section
      ref={ref}
      data-win={id}
      aria-label={label}
      onPointerDownCapture={() => bringToFront(ref.current)}
      className={`absolute flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#12141c]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.75)] backdrop-blur ${closed ? 'hidden' : ''} ${className}`}
    >
      <div onPointerDown={startDrag} className="flex shrink-0 select-none items-center gap-2 bg-[#1b1e27] pl-3 pr-1.5 sm:cursor-grab">
        <div className="min-w-0 flex-1">{bar}</div>
        <div className="flex items-center gap-1 text-white/45" aria-hidden="true">
          <span className="grid h-5 w-5 place-items-center rounded text-[13px] leading-none">–</span>
          <span className="grid h-5 w-5 place-items-center rounded text-[10px] leading-none">▢</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`${label} penceresini kapat`}
          className="grid h-5 w-5 place-items-center rounded text-[13px] leading-none text-white/55 hover:bg-[#e5484d] hover:text-white"
        >
          ×
        </button>
      </div>
      {children}
    </section>
  );
}

// ─── Terminal ───
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

function Terminal({ t, closed, onClose, openTab }) {
  return (
    <Win
      id={t.id}
      label={`Terminal: ${t.title}`}
      closed={closed}
      onClose={onClose}
      className={`max-h-[30%] sm:max-h-[44%] ${t.pos}`}
      bar={<p className="truncate py-1.5 text-center font-mono text-[11px] text-white/55">{t.title}</p>}
    >
      {/* Kaydırılabilir gövde: eski satırlar için yukarı kaydırılabilir; yeni satırlar altta. */}
      <div data-term-body className="k-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2.5 font-mono text-[10.5px] leading-[1.55] text-white/85 sm:text-[12px]">
        <div className="flex min-h-full flex-col justify-end">
        {t.script.map((s, i) => {
          if (s.cmd)
            return (
              <div key={i} data-line data-ch={s.ch ?? 0} className={i ? 'mt-1.5' : ''}>
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
                data-ch={s.ch ?? 0}
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
              data-ch={s.ch ?? 0}
              className={`whitespace-pre-wrap ${s.dim ? 'text-white/40' : ''} ${s.head ? 'font-bold text-white' : ''} ${s.tone ?? ''}`}
            >
              {s.out}
            </div>
          );
        })}
        <div className="mt-1.5">
          <Prompt>
            <span className="k-cursor" aria-hidden="true" />
          </Prompt>
        </div>
        </div>
      </div>
    </Win>
  );
}

// ─── Tarayıcı sekmelerinin içerikleri ───
const Label = ({ children }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{children}</p>
);

const SIDE = {
  red: { label: 'red', tone: 'text-[#ff8a8a]' },
  blue: { label: 'blue', tone: 'text-[#8ab4ff]' },
  purple: { label: 'purple', tone: 'text-[#c4a1ff]' },
  tool: { label: 'araç', tone: 'text-white/50' },
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

function TabContent({ id }) {
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
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
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

  if (id === 'projeler')
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <Label>~/projeler</Label>
          <ExtLink href={P.github} className="font-mono text-[11px] text-white/55">
            github.com/OnurTugran ↗
          </ExtLink>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {PROJECTS.map((p) => (
            <a
              key={p.name}
              href={REPO(p.name)}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-md border border-white/10 bg-[#0f121a] transition-colors hover:border-[#a78bfa]/50 hover:bg-[#141826]"
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
            </a>
          ))}
        </div>
      </div>
    );

  if (id === 'yetkinlikler')
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
                {list.map((x) => (
                  <li key={x}>{x}</li>
                ))}
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
            <div key={k} className="grid gap-1 p-3 sm:grid-cols-[120px_1fr]">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
              <dd className="text-white/75">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );

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
          ['E-posta', `mailto:${P.email}`, P.email],
          ['GitHub', P.github, 'github.com/OnurTugran'],
          ['LinkedIn', P.linkedin, 'linkedin.com/in/onur-tuğran'],
          ['TryHackMe', P.tryhackme, 'tryhackme.com/p/DiSSgusted'],
          ['HackTheBox', P.hackthebox, 'HTB profili'],
          ['CV', P.cv, 'Emin_Onur_Tugran_CV.pdf'],
        ].filter(([, href]) => href).map(([k, href, v]) => (
          <li key={k} className="flex items-center justify-between gap-4 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</span>
            <ExtLink href={href} className="truncate text-white/80">
              {v}
            </ExtLink>
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
        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">TryHackMe</span>
        <span className="block truncate text-white/85">DiSSgusted — odaları ve rozetleri gör ↗</span>
      </span>
    </a>
  );
}

function Browser({ tab, setTab, closed, onClose }) {
  return (
    <Win
      id="tarayici"
      label="Tarayıcı"
      closed={closed}
      onClose={onClose}
      className="left-[3%] right-[3%] top-10 h-[44%] sm:right-auto sm:left-[4%] sm:top-[9%] sm:h-[80%] sm:w-[58%] md:left-[10%] md:w-[52%]"
      bar={
        <div role="tablist" aria-label="Sekmeler" className="flex items-end gap-1 overflow-x-auto pt-1.5 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              data-tab
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex min-w-[84px] max-w-40 flex-1 items-center sm:min-w-0 gap-1.5 rounded-t-md px-2.5 py-1.5 text-left text-[11px] sm:text-xs ${
                tab === t.id ? 'bg-[#12141c] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tab === t.id ? 'bg-[#a78bfa]' : 'bg-white/30'}`} />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      }
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-1.5 text-white/40">
        <span className="hidden text-sm sm:inline" aria-hidden="true">
          ←  →  ↻
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded bg-black/40 px-2.5 py-1 font-mono text-[11px]">
          {Icon.lock}
          <span className="truncate">
            <span className="text-white/40">https://</span>
            <span className="text-white/80">{P.domain}</span>
            <span className="text-white/40">/{tab}</span>
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[#0b0d13] p-4 sm:p-8">
        {TABS.map((t) => (
          <div key={t.id} role="tabpanel" hidden={tab !== t.id} className={tab === t.id ? 'k-fade' : ''}>
            <TabContent id={t.id} />
          </div>
        ))}
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
// Scroll'la değil, tıklamayla çalışan masaüstü: simgeler pencere açar, 1–4 gerçek çalışma alanlarıdır.
const WINDOW_IDS = ['tarayici', ...TERMINALS.map((t) => t.id)];

const KaliDesktop = forwardRef(function KaliDesktop(_props, ref) {
  const now = useClock();
  const [tab, setTab] = useState('hakkimda');
  const [ws, setWs] = useState(1);
  // Her pencere hangi çalışma alanında açık (yoksa kapalı).
  // Telefonda başlangıçta sadece tarayıcı + ilk terminal açık (pencereler üst üste binmesin);
  // diğer terminaller paneldeki terminal düğmesiyle açılır.
  const [where, setWhere] = useState(() => {
    const phone = typeof window !== 'undefined' && window.innerWidth < 640;
    return Object.fromEntries(WINDOW_IDS.map((id) => [id, phone && id !== 'tarayici' && id !== 't1' ? undefined : 1]));
  });
  const rootRef = useRef(null);
  const layerRef = useRef(null);
  const prevWs = useRef(1);

  const setRefs = (el) => {
    rootRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  const front = (id) => bringToFront(rootRef.current?.querySelector(`[data-win="${id}"]`));
  const isOpen = (id) => where[id] === ws;
  const openWin = (id) => {
    setWhere((w) => ({ ...w, [id]: ws }));
    requestAnimationFrame(() => front(id));
  };
  const close = (id) => setWhere((w) => ({ ...w, [id]: undefined }));
  const openTab = (id) => {
    setTab(id);
    openWin('tarayici');
  };
  // Terminal simgesi: bu alanda henüz açık olmayan ilk terminali açar.
  const openTerminal = () => openWin(TERMINALS.find((t) => !isOpen(t.id))?.id ?? TERMINALS[0].id);

  // ── Gizli sürpriz: klavyede "fsociety" yazılınca (telefonda: ejderha simgesine 5 kez dokununca) poster açılır.
  const openPoster = () => openWin('poster');
  useEffect(() => {
    let buf = '';
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target.closest?.('input, textarea, [contenteditable]')) return;
      buf = (buf + e.key.toLowerCase()).slice(-8);
      if (buf === 'fsociety') openWin('poster');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const taps = useRef([]);
  const dragonTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      openPoster();
    }
  };

  // Çalışma alanı değişince pencereler yana kayarak gelir (Linux'taki gibi).
  useEffect(() => {
    const dir = Math.sign(ws - prevWs.current);
    prevWs.current = ws;
    if (!dir || !layerRef.current) return;
    gsap.fromTo(layerRef.current, { xPercent: dir * 6, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' });
  }, [ws]);

  const tasks = [
    { id: 'tarayici', label: 'Tarayıcı', icon: Icon.globe },
    ...TERMINALS.map((t) => ({ id: t.id, label: t.title, icon: Icon.terminal })),
    { id: 'poster', label: 'hello_friend.png', icon: Icon.folder },
  ].filter((t) => isOpen(t.id));
  const busy = (n) => WINDOW_IDS.some((id) => where[id] === n);

  return (
    <div ref={setRefs} className="absolute inset-0 overflow-hidden bg-black font-sans text-white" aria-label="Kali Linux masaüstü">
      <Wallpaper />

      <div data-k="desktop" className="absolute inset-0">
        <div data-k="panel" className="relative z-[60] flex h-8 items-center gap-2 bg-[#14161d]/95 px-2 text-white/70 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <button type="button" onClick={dragonTap} aria-label="Kali menüsü" className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">
            <img src={`${import.meta.env.BASE_URL}assets/kali_dragon.png`} alt="" className="h-7 w-7" draggable="false" />
          </button>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <button type="button" onClick={() => openTab('projeler')} aria-label="Dosyalar" className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
              {Icon.folder}
            </button>
            <button type="button" onClick={openTerminal} aria-label="Terminal aç" className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
              {Icon.terminal}
            </button>
            <button type="button" onClick={() => openTab(tab)} aria-label="Tarayıcı aç" className="grid h-6 w-6 place-items-center rounded hover:bg-white/10">
              {Icon.globe}
            </button>
          </span>
          {/* Çalışma alanları: tıklayınca geçilir; içinde pencere olanların altında çizgi. */}
          <span className="flex items-center gap-0.5 font-mono text-[10px]" role="group" aria-label="Çalışma alanları">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWs(n)}
                aria-pressed={n === ws}
                aria-label={`Çalışma alanı ${n}`}
                className={`relative grid h-5 w-5 place-items-center rounded-sm transition-colors duration-200 ${
                  n === ws ? 'bg-[#367bf0] text-white' : 'bg-white/5 hover:bg-white/15'
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
                onClick={() => front(t.id)}
                className="flex min-w-0 max-w-44 items-center gap-1.5 rounded bg-white/[0.06] px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                {t.icon}
                <span className="hidden truncate md:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-3 pl-1 text-xs">
            <span className="hidden sm:inline">{Icon.wifi}</span>
            <span className="tabular-nums">{hhmm(now)}</span>
          </span>
        </div>

        <DesktopIcons tab={isOpen('tarayici') ? tab : null} openTab={openTab} focusTerminal={openTerminal} />

        <div ref={layerRef} className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto">
          <Browser tab={tab} setTab={setTab} closed={!isOpen('tarayici')} onClose={() => close('tarayici')} />
          <Win
            id="poster"
            label="hello_friend.png"
            closed={!isOpen('poster')}
            onClose={() => close('poster')}
            className="left-[5%] right-[5%] top-10 sm:left-[calc(50%-200px)] sm:right-auto sm:top-[6%] sm:w-[400px]"
            bar={<p className="truncate py-1.5 text-center font-mono text-[11px] text-white/55">hello_friend.png — gizli dosya bulundu</p>}
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/hello_friend_bw.jpg`}
              alt="fsociety tarzı poster: maske ve 'hello, friend.' yazısı"
              className="block max-h-[78svh] w-full object-contain"
              loading="lazy"
            />
          </Win>
          {TERMINALS.map((t) => (
            <Terminal key={t.id} t={t} closed={!isOpen(t.id)} onClose={() => close(t.id)} openTab={openTab} />
          ))}
        </div>
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

  gsap.set(wall, { autoAlpha: 0, scale: 1.12 });
  gsap.set(panel, { yPercent: -100 });
  gsap.set(qa('[data-icon]'), { autoAlpha: 0, x: -14 });
  gsap.set(qa('[data-win]'), { autoAlpha: 0, scale: 0.94, y: 18 });
  gsap.set(qa('[data-task]'), { autoAlpha: 0 });
  // Sadece başlangıçta açık terminallerin satırları scroll'la yazılır; kapalı olanlar açılınca hazır görünür.
  const isStartOpen = (id) => !!q(`[data-task="${id}"]`);
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
