import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import KaliDesktop, { P, addDesktopScroll } from './KaliDesktop.jsx';
import { MOTION_QUERY } from '../motion.js';
import { playUiChime } from '../sfx.js';

const MASCOT_TIPS = [
  "Çalışma Alanı 3'teki canlı saldırı topolojisini denedin mi? ⚡",
  't1 terminalinde gizli ~/.auth.log dosyası seni bekliyor 👀',
  'Masaüstünde boş bir yere sağ tıkla → tema değiştir ve ekranı kilitle!',
  "Çalışma Alanı 4'te Cyber HUD ve MITRE ATT&CK haritası açık.",
  'Saldırıyı anla, savunmayı kur. — Purple Loop aktif ⚑',
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Timeline'ın her birimi için kaç % scroll.
const SCROLL_PER_UNIT = 32;

// Hero'daki "Enter"dan sonra açılan oturum. Bölüm ekrana sabitlenir (pin):
// siyah ekran → duvar kağıdı → panel, simgeler, pencereler → terminaller yazar.
// Sekmeler ve 1–4 çalışma alanları scroll'la değişmez, tıklamayla çalışır.
export default function PortfolioContent() {
  const sectionRef = useRef(null);
  const desktopRef = useRef(null);
  const [tipIdx, setTipIdx] = useState(-1);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
        addDesktopScroll(tl, desktopRef.current);
        tl.to({}, { duration: 0.6 });
        let notified = false;
        ScrollTrigger.create({
          id: 'desktop-pin',
          animation: tl,
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${Math.round(tl.duration() * SCROLL_PER_UNIT)}%`,
          pin: true,
          scrub: 0.6,
          onUpdate(self) {
            if (!notified && self.progress >= 0.85) {
              notified = true;
              desktopRef.current?.dispatchEvent(new CustomEvent('kali-siem-notify'));
            }
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <>
      <section ref={sectionRef} className="relative h-svh min-h-[640px] bg-black" aria-label="Portfolyo">
        <KaliDesktop ref={desktopRef} />
      </section>

      {/* Alt bilgi */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#06070e] px-6 py-16 sm:px-12">
        {/* Animasyonlu neon ufuk ışığı & arka hale */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-px overflow-hidden"
          aria-hidden="true"
        >
          <div className="k-horizon-beam h-full w-1/3 bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />
        </div>
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[520px] -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <div className="relative shrink-0">
              {tipIdx >= 0 && (
                <div
                  role="status"
                  className="k-toast absolute bottom-full left-0 z-20 mb-3 w-64 rounded-lg border border-[#a78bfa]/40 bg-[#101421]/95 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/85 shadow-[0_14px_34px_rgba(0,0,0,0.8)] backdrop-blur-md"
                >
                  {MASCOT_TIPS[tipIdx]}
                  <span className="absolute -bottom-1.5 left-7 h-3 w-3 rotate-45 border-b border-r border-[#a78bfa]/40 bg-[#101421]" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setTipIdx((i) => (i + 1) % MASCOT_TIPS.length);
                  playUiChime();
                }}
                aria-label="Maskottan siber güvenlik ipucu al"
                title="Tıkla: Purple Team ipucu"
                className="group relative block rounded-lg border border-white/15 bg-black/40 transition hover:border-[#a78bfa]/65 hover:shadow-[0_0_24px_-4px_rgba(167,139,250,0.5)] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/60"
              >
                <img
                  src={`${import.meta.env.BASE_URL}assets/maskot.png`}
                  alt=""
                  className="h-20 w-20 rounded-lg [image-rendering:pixelated] transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Purple Team</p>
              <p className="mt-3 font-serif text-4xl leading-none text-white">{P.name}</p>
              <p className="mt-3 text-sm text-white/55">Saldırıyı anlayan, savunmayı kuran.</p>
            </div>
          </div>
          <nav aria-label="Bağlantılar" className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-white/65">
            {[
              ['GitHub', P.github],
              ['LinkedIn', P.linkedin],
              ['TryHackMe', P.tryhackme],
              ['HackTheBox', P.hackthebox],
              ['E-posta', `mailto:${P.email}`],
              ['CV ↓', P.cv],
            ].filter(([, href]) => href).map(([k, href]) => (
              <a key={k} href={href} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-4 hover:text-white">
                {k}
              </a>
            ))}
          </nav>
        </div>
        <p className="mx-auto mt-12 max-w-5xl font-mono text-[10px] text-white/30">© {new Date().getFullYear()} {P.name}</p>
      </footer>
    </>
  );
}
