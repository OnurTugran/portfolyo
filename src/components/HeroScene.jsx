import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import KaliLogin, { addLoginTimeline } from './KaliLogin.jsx';
import FsocietyScreen, { FS_W, FS_H, fsocietyLife } from './FsocietyScreen.jsx';
import { TALL_BOX, tallLife, tvLife } from './sideScreens.js';
import { MOTION_QUERY } from '../motion.js';
import { getLenis } from '../smooth.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SVG_NS = 'http://www.w3.org/2000/svg';
const BASE = `${import.meta.env.BASE_URL}assets/`;
const LINES_SRC = `${BASE}hacker_oda_cizim.svg`;
// Higgsfield ile üretilen özgün sahne. Çizgiler bunun dış hatları.
const PHOTO = { big: `${BASE}hacker_oda_hf.jpg`, small: `${BASE}hacker_oda_hf_1920.jpg` };
// Ana monitör ekranının fotoğraftaki yeri (SVG koordinatı, 1600×900) — zoom bunu hedefler.
const SCREEN = { x: 441.25, y: 232.5, width: 810.4, height: 372.5 };
// Monitörde uzaktan görünen ekran (kullanıcının UzaktanMasaüstü görseli) ve ekranın kapüşon hariç maskesi.
const SCREEN_IMG = `${BASE}uzaktan_masaustu.jpg`;
const SCREEN_MASK = `${BASE}ekran_maske.png`;

// Fotoğraftaki yan ekranlar (SVG koordinatı) — renk geldikten sonra canlanırlar.
const CCTV = { x: 93, y: 99, width: 244, height: 201 }; // sol üst eski monitör (içinde fsociety sahnesi)
const TV = { x: 66, y: 421, width: 147, height: 127 }; // sol alt: küçük CRT TV (kanallar)
// Yan ekranların canlı animasyonları. Hepsi duraklatılmış döner; oynatma HeroScene'deki sync'te.
function screenLife(root) {
  const q = (k) => root.querySelector(`[data-fx="${k}"]`);
  const out = [];

  // ── Sağ dikey monitör: akan kod satırları, monitörün perspektifine göre (canvas).
  out.push(tallLife(q('tall-canvas')));

  // ── Sol üst eski monitör: içinde fsociety pop-up sahnesi döner; üstünde düzensiz titreme ve kararma.
  out.push(...fsocietyLife(root));
  const flash = q('cctv-flash');
  const dim = q('cctv-dim');
  const glitch = gsap.timeline({ repeat: -1, paused: true });
  // 14 sn'lik, önceden "rastgele" dizilmiş olay listesi; döngü fark edilmez.
  for (let i = 0, t = 0.6; t < 13.5; i++) {
    if (rand(i + 202) < 0.5) {
      // Hızlı parlama titremesi
      glitch
        .set(flash, { opacity: 0.22 }, t)
        .set(flash, { opacity: 0.04 }, t + 0.05)
        .set(flash, { opacity: 0.16 }, t + 0.09)
        .to(flash, { opacity: 0, duration: 0.18 }, t + 0.13);
    } else {
      // Görüntü bir an kararıp geri gelir
      glitch
        .set(dim, { opacity: 0.65 }, t)
        .set(dim, { opacity: 0.1 }, t + 0.06)
        .set(dim, { opacity: 0.5 }, t + 0.1)
        .set(dim, { opacity: 0 }, t + 0.16);
    }
    t += 0.6 + rand(i + 505) * 2.2;
  }
  glitch.set({}, {}, 14);
  out.push(glitch);
  // Sürekli, çok hafif CRT titremesi
  out.push(
    gsap.to(q('cctv-shimmer'), { opacity: 0.06, duration: 0.07, ease: 'steps(1)', repeat: -1, yoyo: true, paused: true }),
  );
  // Ekranda yavaşça aşağı inen parlak tarama bandı
  out.push(
    gsap.fromTo(
      q('cctv-bar'),
      { attr: { y: CCTV.y - 40 } },
      { attr: { y: CCTV.y + CCTV.height }, duration: 4.5, ease: 'none', repeat: -1, repeatDelay: 1.5, paused: true },
    ),
  );

  // ── Sol alt küçük TV: kanallar arasında gezinir (radar → osiloskop → dünya), aralarda karınca.
  out.push(tvLife(q('tv-canvas'), TV.width, TV.height));
  out.push(
    gsap.fromTo(
      q('tv-bar'),
      { attr: { y: TV.y - 30 } },
      { attr: { y: TV.y + TV.height }, duration: 2.2, ease: 'none', repeat: -1, repeatDelay: 0.8, paused: true },
    ),
  );
  const tvFlash = q('tv-flash');
  out.push(
    gsap
      .timeline({ repeat: -1, repeatDelay: 2.6, paused: true })
      .set(tvFlash, { opacity: 0.25 }, 1)
      .set(tvFlash, { opacity: 0.05 }, 1.05)
      .set(tvFlash, { opacity: 0.18 }, 1.1)
      .to(tvFlash, { opacity: 0, duration: 0.25 }, 1.15),
  );

  return out;
}

// Dar/dikey ekran: kişi + ana monitörün sol yarısı ekranı doldursun (slice = kırparak kapla).
const MOBILE_VIEWBOX = '210 120 620 780';
// Timeline'ın her birimi için kaç % scroll.
const SCROLL_PER_UNIT = 35;
// Açılışta çizgilerin kendiliğinden gelme süresi (sn).
const AUTO_DRAW_SECONDS = 11;

// Pencerenin görünen alanını SVG koordinatlarına çevirir (viewBox'tan büyük olabilir).
function visibleBox(svg) {
  const m = svg.getScreenCTM().inverse();
  const r = svg.getBoundingClientRect();
  const a = new DOMPoint(r.left, r.top).matrixTransform(m);
  const b = new DOMPoint(r.right, r.bottom).matrixTransform(m);
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
}

// Pencere çevresi üzerinde t (0–1) konumundaki nokta (+ dışarı pay).
// Her çizgiye altın oranla dağıtılmış bir t verilir → çizgiler ekranın dört bir yanından (üst, alt, sağ, sol) gelir.
function perimeterPoint(box, t, pad = 60) {
  const x0 = box.x0 - pad;
  const y0 = box.y0 - pad;
  const w = box.x1 - box.x0 + pad * 2;
  const h = box.y1 - box.y0 + pad * 2;
  let d = (((t % 1) + 1) % 1) * 2 * (w + h);
  if (d < w) return { x: x0 + d, y: y0 };
  d -= w;
  if (d < h) return { x: x0 + w, y: y0 + d };
  d -= h;
  if (d < w) return { x: x0 + w - d, y: y0 + h };
  d -= w;
  return { x: x0, y: y0 + h - d };
}
const GOLDEN = 0.618034;

// Kenardan konturun başına "S" kıvrımlı giriş eğrisi — yılan hareketi buradan geliyor.
function leadIn(e, s, i) {
  const dx = s.x - e.x;
  const dy = s.y - e.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // Uzun girişlerde kıvrım abartılmasın.
  const k = Math.min(len * 0.2, 220) * (i % 2 ? 1 : -1);
  const f = (n) => n.toFixed(1);
  return (
    `M ${f(e.x)} ${f(e.y)} ` +
    `C ${f(e.x + dx * 0.33 + nx * k)} ${f(e.y + dy * 0.33 + ny * k)} ` +
    `${f(e.x + dx * 0.66 - nx * k)} ${f(e.y + dy * 0.66 - ny * k)} ${f(s.x)} ${f(s.y)}`
  );
}

// Basit deterministik "rastgele" — her yenilemede aynı sahne.
const rand = (i) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Monitör ekranını pencereyi kaplayacak kadar büyütecek ölçek ve transform-origin.
// Origin F öyle seçilir ki ölçekleme sonunda ekranın merkezi P, pencerenin merkezi C'ye oturur:
//   F + s·(P − F) = C   →   F = (C − s·P) / (1 − s)
function monitorZoom(stage, target) {
  const st = stage.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const s = Math.max(st.width / t.width, st.height / t.height) * 1.04;
  const P = { x: t.left - st.left + t.width / 2, y: t.top - st.top + t.height / 2 };
  const C = { x: st.width / 2, y: st.height / 2 };
  const F = { x: (C.x - s * P.x) / (1 - s), y: (C.y - s * P.y) / (1 - s) };
  return { scale: s, origin: `${F.x.toFixed(2)}px ${F.y.toFixed(2)}px` };
}

const START = /^\s*M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/;

export default function HeroScene() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const sceneRef = useRef(null);
  const photoRef = useRef(null);
  const colorRef = useRef(null);
  const screenRef = useRef(null);
  const titleRef = useRef(null);
  const loginRef = useRef(null);
  const fxRef = useRef(null);
  const hintRef = useRef(null);
  const screenFullRef = useRef(null);
  const roomDimRef = useRef(null);

  useGSAP(
    () => {
      let source = null;
      let ctx = null;
      let alive = true;
      let lastWidth = window.innerWidth;
      let timer;
      // Otomatik açılış kaydırması sayfa başına bir kez.
      let autoplayed = false;

      const build = () => {
        ctx?.revert();
        const svg = svgRef.current;
        const scene = sceneRef.current;
        const color = colorRef.current;
        scene.replaceChildren();

        // Dar/dikey ekranda kadrajı kişi + ana monitöre yaklaştır, ince detayları at.
        const narrow = window.innerWidth < 640;
        svg.setAttribute('viewBox', narrow ? MOBILE_VIEWBOX : source.getAttribute('viewBox'));
        svg.setAttribute('preserveAspectRatio', narrow ? 'xMidYMid slice' : 'xMidYMid meet');
        const photoSrc = narrow ? PHOTO.small : PHOTO.big;
        photoRef.current.setAttribute('href', photoSrc);

        const drawing = document.importNode(source.querySelector(':scope > g'), true);
        scene.appendChild(drawing);
        if (narrow) drawing.querySelectorAll('.fine').forEach((n) => n.remove());

        ctx = gsap.context(() => {
          const mm = gsap.matchMedia();

          mm.add(MOTION_QUERY, () => {
            // ── 1. aşama: siyah ekran → kenarlardan süzülen beyaz çizgiler ──
            gsap.set(titleRef.current, { autoAlpha: 0, y: 16 });
            gsap.set(color, { opacity: 0 });
            const box = visibleBox(svg);
            const probe = document.createElementNS(SVG_NS, 'path');
            svg.appendChild(probe);

            // Yerine oturan çizgilerin üzerinde gezinen ışık atımları (orijinal konturun kopyası):
            // geniş mor hale + ince parlak çekirdek.
            const pulseLayer = (stroke, width, opacity) => {
              const g = document.createElementNS(SVG_NS, 'g');
              g.setAttribute('fill', 'none');
              g.setAttribute('stroke', stroke);
              g.setAttribute('stroke-width', width);
              g.setAttribute('stroke-opacity', opacity);
              // butt: bekleyen (yolun dışındaki) atım, uçlarda nokta bırakmasın.
              g.setAttribute('stroke-linecap', 'butt');
              g.setAttribute('stroke-linejoin', 'round');
              return g;
            };
            const halos = pulseLayer('#9a6bff', '7', '0.45');
            const cores = pulseLayer('#f6f0ff', '2.4', '1');

            const items = [...drawing.querySelectorAll('path')]
              .map((path, i) => {
                const d = path.getAttribute('d');
                const m = d.match(START);
                if (!m) return null;
                const s = { x: +m[1], y: +m[2] };

                probe.setAttribute('d', d);
                const contour = probe.getTotalLength();

                const halo = document.createElementNS(SVG_NS, 'path');
                halo.setAttribute('d', d);
                halos.appendChild(halo);
                const core = halo.cloneNode();
                cores.appendChild(core);
                const pulse = [halo, core];

                // Kenardaki giriş noktası + S eğrisi + asıl kontur tek yol olur;
                // dashoffset kayınca görünen parça kenardan yılan gibi kayıp yerine oturur.
                const e = perimeterPoint(box, i * GOLDEN + rand(i) * 0.08);
                const body = d.replace(START, '').replace(/[Zz]\s*$/, `L ${s.x} ${s.y}`);
                const full = `${leadIn(e, s, i)} ${body}`;
                probe.setAttribute('d', full);
                const total = probe.getTotalLength();
                const lead = total - contour;

                path.setAttribute('d', full);
                gsap.set(path, {
                  strokeDasharray: `${contour + 1} ${total + contour + 2}`,
                  strokeDashoffset: contour + 1,
                });

                const step = +(path.closest('[data-step]')?.dataset.step ?? 9);
                // Yolun kendisi de geldiği kenara doğru biraz itilir, çizilirken yerine kayar (translate).
                const push = { x: (e.x - s.x) * 0.1, y: (e.y - s.y) * 0.1 };
                return { path, pulse, contour, step, from: contour + 1, to: -(lead - 0.5), push };
              })
              .filter(Boolean);
            probe.remove();
            scene.append(halos, cores);

            items.sort((a, b) => a.step - b.step);

            // Tek timeline, scroll'a bağlı. Çizgiler de başta: sayfa açılınca site kendini yavaşça kaydırır
            // (çizgiler kendiliğinden gelir), ama kullanıcı istediği an yukarı kaydırıp simsiyah başa dönebilir.
            const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });

            // Scroll'dan bağımsız, zamanla dönen "canlı" animasyonlar. Sadece görünürken oynar.
            const lineLife = [];
            const photoLife = [];

            // Yol sayısı ne olursa olsun çizim aşaması ~7 birimde kalsın.
            const gap = Math.min(0.07, 5.6 / items.length);
            items.forEach((it, i) => {
              const at = 0.3 + i * gap;
              tl.fromTo(
                it.path,
                { strokeDashoffset: it.from, x: it.push.x, y: it.push.y },
                { strokeDashoffset: it.to, x: 0, y: 0, duration: 1.4, ease: 'power1.inOut' },
                at,
              );

              // Çizgi yerine oturunca üzerinde kısa bir ışık konturu baştan sona dolaşır, ara verip tekrarlar.
              // Şekil hiç değişmez; sadece ışık akar.
              const L = it.contour;
              const p = Math.min(Math.max(L * 0.16, 10), 70);
              gsap.set(it.pulse, { strokeDasharray: `${p} ${L + p * 2}`, strokeDashoffset: p, opacity: 0 });
              lineLife.push(
                gsap.fromTo(
                  it.pulse,
                  { strokeDashoffset: p },
                  {
                    strokeDashoffset: -L,
                    duration: Math.min(Math.max(L / 260, 0.7), 4),
                    ease: 'power1.inOut',
                    repeat: -1,
                    repeatDelay: 0.6 + rand(i + 7) * 3,
                    delay: rand(i + 3) * 2.5,
                    paused: true,
                  },
                ),
              );
              tl.fromTo(it.pulse, { opacity: 0 }, { opacity: 1, duration: 0.4 }, at + 1.3);
            });

            // Çizim hafifçe "nefes alır" (parlaklık), konturlar yerinden oynamaz.
            lineLife.push(
              gsap.fromTo(
                drawing,
                { opacity: 1 },
                { opacity: 0.6, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true },
              ),
            );

            tl.to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4');
            tl.fromTo(hintRef.current, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>-0.2');
            // Otomatik kaydırma burada durur; buradan sonrası kullanıcının scroll'u.
            tl.addLabel('dur');
            tl.to({}, { duration: 0.4 });

            // ── 2. aşama: çizgiler söner, renkli fotoğraf altından belirir ──
            tl.addLabel('renk');
            tl.to(hintRef.current, { autoAlpha: 0, duration: 0.4 }, 'renk');
            tl.to(scene, { opacity: 0, duration: 3, ease: 'power1.inOut' }, 'renk');
            tl.fromTo(color, { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power1.inOut' }, 'renk+=0.3');
            tl.to({}, { duration: 0.6 });

            // Kamera ana monitöre yaklaşır, ekran pencereyi kaplar.
            const zoom = monitorZoom(stageRef.current, screenRef.current);
            gsap.set(stageRef.current, { transformOrigin: zoom.origin });
            tl.addLabel('zoom');
            tl.to(titleRef.current, { autoAlpha: 0, y: -12, duration: 0.8, ease: 'power1.in' }, 'zoom');
            tl.fromTo(
              stageRef.current,
              { scale: 1 },
              { scale: zoom.scale, duration: 4.5, ease: 'power2.inOut', force3D: false },
              'zoom',
            );
            // Kapüşon ekranın önünden yavaşça silinir (ekran içeriği maskesiz görünür).
            tl.fromTo(screenFullRef.current, { opacity: 0 }, { opacity: 1, duration: 2.2, ease: 'power1.inOut' }, 'zoom+=0.6');
            tl.fromTo(roomDimRef.current, { opacity: 0 }, { opacity: 0.9, duration: 2.6, ease: 'power1.inOut' }, 'zoom+=0.4');
            tl.to({}, { duration: 0.3 });

            // ── 3. aşama: monitörün içinde giriş ekranı → root → şifre → Enter ──
            tl.addLabel('giris');
            addLoginTimeline(tl, loginRef.current, 'giris');
            // Giriş ekranı tamamen örtünce dev ölçekli sahneyi gizle; arkada boşuna boyanmasın.
            tl.set(stageRef.current, { autoAlpha: 0 }, 'giris+=0.7');
            tl.to({}, { duration: 0.4 });

            // ── 4. aşama: oturum açılır — giriş ekranı yumuşakça bulanıklaşıp kararır.
            // Ekran tamamen siyahken sabitleme biter; altından gelen masaüstü de siyahtan doğar → dikiş yok.
            tl.addLabel('cikis');
            tl.to(loginRef.current, { autoAlpha: 0, scale: 1.04, filter: 'blur(8px)', duration: 1.8, ease: 'power1.inOut' }, 'cikis');
            tl.to({}, { duration: 0.6 });

            photoLife.push(...screenLife(fxRef.current));

            // Hangi canlı animasyon ne zaman oynasın: çizgiler renk gelene kadar, yan ekranlar renk gelince.
            const renkEnd = tl.labels.renk + 3;
            const fotoStart = tl.labels.renk;
            const fotoEnd = tl.labels.giris + 0.7;
            const state = { lines: null, photo: null };
            const sync = () => {
              const t = tl.time();
              const lines = t < renkEnd;
              const photo = t > fotoStart && t < fotoEnd;
              if (lines !== state.lines) lineLife.forEach((a) => (lines ? a.play() : a.pause()));
              if (photo !== state.photo) photoLife.forEach((a) => (photo ? a.play() : a.pause()));
              state.lines = lines;
              state.photo = photo;
            };
            tl.eventCallback('onUpdate', sync);
            sync();

            // Scroll uzunluğu timeline'ın süresinden gelir; aşama eklenince hız aynı kalır.
            const st = ScrollTrigger.create({
              animation: tl,
              trigger: sectionRef.current,
              start: 'top top',
              end: `+=${Math.round(tl.duration() * SCROLL_PER_UNIT)}%`,
              pin: true,
              // Lenis zaten yumuşatıyor; kısa scrub yeterli, gecikme hissi olmasın.
              scrub: 0.6,
              // Sayfada üstte olduğu için (veri geç yüklense de) önce bu hesaplansın.
              refreshPriority: 1,
            });

            // Sayfa en üstte açıldıysa: çizgiler gelene kadar site kendi kaydırır (yavaş, yumuşak).
            // Kullanıcı tekerleği çevirirse otomatik kaydırma anında bırakır.
            if (!autoplayed && window.scrollY < 4) {
              autoplayed = true;
              const pos = { y: 0 };
              const go = (y) => {
                const lenis = getLenis();
                if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
                else window.scrollTo(0, y);
              };
              const auto = gsap.to(pos, {
                y: () => st.start + (tl.labels.dur / tl.duration()) * (st.end - st.start),
                duration: AUTO_DRAW_SECONDS,
                delay: 0.6,
                ease: 'sine.inOut',
                onUpdate: () => go(pos.y),
                onComplete: () => stopAuto(),
              });
              // Kullanıcı kendisi kaydırmaya/tuşa basmaya başlarsa otomatik kaydırma bırakır.
              const stopAuto = () => {
                auto.kill();
                ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((e) => window.removeEventListener(e, stopAuto));
              };
              ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((e) => window.addEventListener(e, stopAuto, { passive: true }));
            }
          });
        }, sectionRef);

        ScrollTrigger.refresh();
      };

      fetch(LINES_SRC)
        .then((r) => r.text())
        .then((text) => {
          if (!alive) return;
          source = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
          build();
        });

      // Sadece genişlik değişince yeniden kur (mobilde adres çubuğu yüksekliği oynatır).
      const onResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!source || window.innerWidth === lastWidth) return;
          lastWidth = window.innerWidth;
          build();
        }, 250);
      };
      window.addEventListener('resize', onResize);

      return () => {
        alive = false;
        clearTimeout(timer);
        window.removeEventListener('resize', onResize);
        ctx?.revert();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative h-svh w-full overflow-hidden bg-black" aria-label="Giriş">
      <div ref={contentRef} className="absolute inset-0">
        <div ref={stageRef} className="absolute inset-0">
          <svg
            ref={svgRef}
            viewBox="0 0 1600 900"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Karanlık bir odada, arkası dönük biri monitörlerin başında çalışıyor"
          >
            {/* Renkli fotoğraf, çizgilerle aynı koordinatlarda ve altlarında. */}
            <defs>
              <mask id="ekran-maske" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
                <image href={SCREEN_MASK} x="0" y="0" width="1600" height="900" preserveAspectRatio="none" />
              </mask>
            </defs>
            <g ref={colorRef} opacity="0">
              <image ref={photoRef} x="0" y="0" width="1600" height="900" preserveAspectRatio="none" />

              {/* Yan ekranların canlı katmanları (fotoğrafın üstünde, sadece ekran camlarının içinde). */}
              <g ref={fxRef}>
                <defs>
                  <clipPath id="fx-cctv">
                    <rect {...CCTV} rx="7" />
                  </clipPath>
                  <clipPath id="fx-tv">
                    <rect {...TV} rx="9" />
                  </clipPath>
                  <pattern id="fx-scan" patternUnits="userSpaceOnUse" width="4" height="2.4">
                    <rect width="4" height="1" fill="#000" />
                  </pattern>
                  <linearGradient id="fx-bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#dfffff" stopOpacity="0" />
                    <stop offset="0.6" stopColor="#dfffff" stopOpacity="0.13" />
                    <stop offset="1" stopColor="#dfffff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Sağ dikey monitör: akan kod (canvas, perspektife göre eğilmiş) */}
                <foreignObject {...TALL_BOX}>
                  <canvas data-fx="tall-canvas" style={{ display: 'block', width: TALL_BOX.width, height: TALL_BOX.height }} />
                </foreignObject>

                {/* Sol üst eski monitör: fsociety pop-up sahnesi (2 kat çözünürlükte çizilip yarıya ölçeklenir) */}
                <g clipPath="url(#fx-cctv)">
                  <g transform={`translate(${CCTV.x} ${CCTV.y}) scale(${CCTV.width / FS_W} ${CCTV.height / FS_H})`}>
                    <foreignObject width={FS_W} height={FS_H}>
                      <FsocietyScreen />
                    </foreignObject>
                  </g>
                  <rect {...CCTV} fill="url(#fx-scan)" opacity="0.22" />
                  <rect data-fx="cctv-bar" x={CCTV.x} y={CCTV.y - 40} width={CCTV.width} height="40" fill="url(#fx-bar)" />
                  <rect data-fx="cctv-shimmer" {...CCTV} fill="#000" opacity="0" />
                  <rect data-fx="cctv-dim" {...CCTV} fill="#000" opacity="0" />
                  <rect data-fx="cctv-flash" {...CCTV} fill="#c9ffff" opacity="0" style={{ mixBlendMode: 'screen' }} />
                </g>

                {/* Sol alt küçük TV: karıncalanma */}
                <g clipPath="url(#fx-tv)">
                  <foreignObject {...TV}>
                    <canvas data-fx="tv-canvas" style={{ display: 'block', width: TV.width, height: TV.height, filter: 'blur(0.35px) saturate(0.85)' }} />
                  </foreignObject>
                  <rect {...TV} fill="url(#fx-scan)" opacity="0.25" />
                  <rect data-fx="tv-bar" x={TV.x} y={TV.y - 30} width={TV.width} height="30" fill="url(#fx-bar)" />
                  <rect data-fx="tv-flash" {...TV} fill="#e6f4ff" opacity="0" style={{ mixBlendMode: 'screen' }} />
                </g>
              </g>
              {/* Ana monitörün ekranı: siyah zemin + ejderha; kapüşonun arkasında kalan kısım maskeyle gizli. */}
              <g mask="url(#ekran-maske)">
                <rect {...SCREEN} fill="#000" />
                <image href={SCREEN_IMG} {...SCREEN} preserveAspectRatio="xMidYMid meet" />
              </g>
              {/* Zoom sırasında ekran maskesiz haliyle belirir: kapüşon ekranla birlikte büyüyüp önünü kapatmasın. */}
              {/* Zoom'da oda (kapüşon dahil) kararır, sadece ekran aydınlık kalır. */}
              <path
                ref={roomDimRef}
                fillRule="evenodd"
                fill="#000"
                opacity="0"
                d={`M-2000 -2000 H3600 V2900 H-2000 Z M${SCREEN.x} ${SCREEN.y} h${SCREEN.width} v${SCREEN.height} h${-SCREEN.width} Z`}
              />
              <g ref={screenFullRef} opacity="0">
                <rect {...SCREEN} fill="#000" />
                <image href={SCREEN_IMG} {...SCREEN} preserveAspectRatio="xMidYMid meet" />
              </g>
              <rect ref={screenRef} {...SCREEN} fill="none" />
            </g>
            <g ref={sceneRef} />
          </svg>
        </div>

        <KaliLogin ref={loginRef} />

        <div
          ref={titleRef}
          className="invisible absolute left-6 top-8 max-w-sm opacity-0 sm:left-12 sm:top-14"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">Purple Team</p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.95] text-white sm:text-6xl">Emin Onur Tuğran</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Saldırıyı anlayan, savunmayı kuran.
            <span className="block text-white/40">Thinks like an attacker, builds like a defender.</span>
          </p>
          <p ref={hintRef} className="invisible mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white/45 opacity-0">
            <span className="inline-block animate-bounce">↓</span> kaydır
          </p>
        </div>
      </div>
    </section>
  );
}
