import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import KaliDesktop, { P, addDesktopScroll } from './KaliDesktop.jsx';
import { MOTION_QUERY } from '../motion.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Timeline'ın her birimi için kaç % scroll.
const SCROLL_PER_UNIT = 32;

// Hero'daki "Enter"dan sonra açılan oturum. Bölüm ekrana sabitlenir (pin):
// siyah ekran → duvar kağıdı → panel, simgeler, pencereler → terminaller yazar.
// Sekmeler ve 1–4 çalışma alanları scroll'la değişmez, tıklamayla çalışır.
export default function PortfolioContent() {
  const sectionRef = useRef(null);
  const desktopRef = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
        addDesktopScroll(tl, desktopRef.current);
        tl.to({}, { duration: 0.6 });
        ScrollTrigger.create({
          animation: tl,
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${Math.round(tl.duration() * SCROLL_PER_UNIT)}%`,
          pin: true,
          scrub: 0.6,
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
      <footer className="relative bg-[#06070e] px-6 py-16 sm:px-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <img
              src={`${import.meta.env.BASE_URL}assets/maskot.png`}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg border border-white/10 [image-rendering:pixelated]"
              loading="lazy"
            />
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
