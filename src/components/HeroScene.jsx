import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import KaliLogin, { addLoginTimeline } from './KaliLogin.jsx';
import FsocietyScreen, { FS_W, FS_H, fsocietyLife } from './FsocietyScreen.jsx';
import { TALL_BOX, tallLife, tvLife } from './sideScreens.js';
import { MOTION_QUERY } from '../motion.js';
import { getLenis } from '../smooth.js';
import { isSfxEnabled, playAlertBlip, playKeyClick, playStaticTick, setSfxPhase, subscribeSfx, toggleSfx } from '../sfx.js';

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
function screenLife(root, narrow = false) {
  const q = (k) => root.querySelector(`[data-fx="${k}"]`);
  const out = [];

  // ── Sağ dikey monitör: akan kod satırları, monitörün perspektifine göre (canvas).
  const tall = tallLife(q('tall-canvas'));
  out.push(tall);

  // ── Sol üst eski monitör: içinde fsociety pop-up sahnesi döner; üstünde düzensiz titreme ve kararma.
  out.push(...fsocietyLife(root));
  const flash = q('cctv-flash');
  const dim = q('cctv-dim');
  const spillCctv = q('spill-cctv');
  const spillAmbilight = q('spill-ambilight');
  const spillAmbilightAlert = q('spill-ambilight-alert');
  const alertLed = q('led-alert');
  const rimLeft = q('rim-left');
  const rimRight = q('rim-right');
  const rimRightAlert = q('rim-right-alert');
  const glitch = gsap.timeline({ repeat: -1, paused: true });
  // 14 sn'lik, önceden "rastgele" dizilmiş olay listesi; döngü fark edilmez.
  for (let i = 0, t = 0.6; t < 13.5; i++) {
    if (rand(i + 202) < 0.5) {
      // Hızlı parlama titremesi
      glitch
        .set(flash, { opacity: 0.22 }, t)
        .set(spillCctv, { opacity: 0.72 }, t)
        .set(rimLeft, { opacity: 0.58 }, t)
        .set(flash, { opacity: 0.04 }, t + 0.05)
        .set(spillCctv, { opacity: 0.45 }, t + 0.05)
        .set(rimLeft, { opacity: 0.22 }, t + 0.05)
        .set(flash, { opacity: 0.16 }, t + 0.09)
        .set(spillCctv, { opacity: 0.66 }, t + 0.09)
        .set(rimLeft, { opacity: 0.48 }, t + 0.09)
        .to(flash, { opacity: 0, duration: 0.18 }, t + 0.13)
        .to(spillCctv, { opacity: 0.52, duration: 0.18 }, t + 0.13)
        .to(rimLeft, { opacity: 0.22, duration: 0.18 }, t + 0.13);
    } else {
      // Görüntü bir an kararıp geri gelir
      glitch
        .set(dim, { opacity: 0.65 }, t)
        .set(spillCctv, { opacity: 0.24 }, t)
        .set(rimLeft, { opacity: 0.08 }, t)
        .set(dim, { opacity: 0.1 }, t + 0.06)
        .set(spillCctv, { opacity: 0.5 }, t + 0.06)
        .set(rimLeft, { opacity: 0.2 }, t + 0.06)
        .set(dim, { opacity: 0.5 }, t + 0.1)
        .set(spillCctv, { opacity: 0.3 }, t + 0.1)
        .set(rimLeft, { opacity: 0.1 }, t + 0.1)
        .set(dim, { opacity: 0 }, t + 0.16)
        .set(spillCctv, { opacity: 0.52 }, t + 0.16)
        .set(rimLeft, { opacity: 0.22, duration: 0.08 }, t + 0.16);
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
  const tvSpills = {
    radar: q('spill-tv-radar'),
    signal: q('spill-tv-signal'),
    live: q('spill-tv-live'),
    static: q('spill-tv-static'),
  };
  const onTvChannel = (key) => {
    Object.entries(tvSpills).forEach(([k, el]) => {
      if (el) gsap.to(el, { opacity: k === key ? 0.58 : 0, duration: 0.35, overwrite: 'auto' });
    });
    if (key === 'static') playStaticTick();
  };
  const onTvAlert = () => {
    tall?.triggerAlert?.();
    if (flash) gsap.fromTo(flash, { opacity: 0.3 }, { opacity: 0, duration: 0.28, overwrite: 'auto' });
    if (spillCctv) gsap.fromTo(spillCctv, { opacity: 0.78 }, { opacity: 0.52, duration: 0.35, overwrite: 'auto' });
    if (spillAmbilightAlert) gsap.fromTo(spillAmbilightAlert, { opacity: 0.55 }, { opacity: 0, duration: 0.9, overwrite: 'auto' });
    if (alertLed) gsap.fromTo(alertLed, { opacity: 1 }, { opacity: 0.15, duration: 0.4, overwrite: 'auto' });
    if (rimRightAlert) gsap.fromTo(rimRightAlert, { opacity: 0.62 }, { opacity: 0, duration: 0.85, overwrite: 'auto' });
    if (rimLeft) gsap.fromTo(rimLeft, { opacity: 0.66 }, { opacity: 0.22, duration: 0.4, overwrite: 'auto' });
    playAlertBlip();
  };
  const tv = tvLife(q('tv-canvas'), TV.width, TV.height, onTvChannel, onTvAlert);
  out.push(tv);
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

  // ── Sağ dikey monitör, kapüşon kenar ışığı, ambilight & klavye/fare ışık nefesi
  out.push(
    gsap.fromTo(q('spill-tall'), { opacity: 0.4 }, { opacity: 0.62, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
    gsap.fromTo(q('spill-desk'), { opacity: 0.38 }, { opacity: 0.58, duration: 4.1, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
    gsap.fromTo(rimRight, { opacity: 0.2 }, { opacity: 0.36, duration: 3.4, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
  );
  if (spillAmbilight) {
    out.push(
      gsap.fromTo(spillAmbilight, { opacity: 0.32 }, { opacity: 0.54, duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
    );
  }
  const mouseGlint = q('mouse-glint');
  if (mouseGlint) {
    out.push(
      gsap.fromTo(mouseGlint, { opacity: 0.22, scale: 0.92, svgOrigin: '1188 746' }, { opacity: 0.65, scale: 1.12, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
    );
  }
  const keyWave = q('key-wave');
  if (keyWave) {
    out.push(
      gsap.fromTo(keyWave, { x: -160 }, { x: 460, duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
    );
  }
  const deskSheen = q('desk-sheen');
  if (deskSheen) {
    out.push(
      gsap.fromTo(deskSheen, { x: -240 }, { x: 860, duration: 4.2, ease: 'sine.inOut', repeat: -1, repeatDelay: 2.2, paused: true }),
    );
  }

  // ── Masa kablosu fiber-optik veri atımları (monitör ayağından mini-PC'ye)
  [q('cable-pulse-1'), q('cable-pulse-2')].filter(Boolean).forEach((el, idx) => {
    const len = el.getTotalLength?.() || 240;
    gsap.set(el, { strokeDasharray: `24 ${len + 30}`, strokeDashoffset: 24 });
    out.push(
      gsap.fromTo(
        el,
        { strokeDashoffset: 24 },
        {
          strokeDashoffset: -len,
          duration: idx === 0 ? 1.7 : 2.1,
          ease: 'power1.inOut',
          repeat: -1,
          repeatDelay: idx === 0 ? 1.4 : 2.5,
          delay: idx * 1.1,
          paused: true,
        },
      ),
    );
  });

  // ── Monitör ışık konilerinde yüzen mikro toz tanecikleri (yalnızca oda görünürken akar)
  const dustCanvas = q('dust-canvas');
  if (dustCanvas) {
    const DW = (dustCanvas.width = 800);
    const DH = (dustCanvas.height = 450);
    const dg = dustCanvas.getContext('2d');
    if (dg) {
      const count = narrow ? 14 : 36;
      const motes = Array.from({ length: count }, (_, i) => {
        const zone = i % 3; // 0: sol CCTV/TV, 1: orta ana monitör, 2: sağ IDE monitör
        const x =
          zone === 0
            ? 40 + rand(i * 7 + 1) * 180
            : zone === 1
              ? 220 + rand(i * 7 + 1) * 400
              : 630 + rand(i * 7 + 1) * 155;
        const y = 70 + rand(i * 11 + 3) * 290;
        const color = zone === 0 ? '94,230,255' : zone === 1 ? '148,185,255' : '196,161,255';
        return {
          x,
          y,
          r: 0.75 + rand(i * 13 + 5) * 1.45,
          vx: (rand(i * 17 + 7) - 0.5) * 8,
          vy: -(3 + rand(i * 19 + 9) * 6),
          phase: rand(i * 23 + 11) * Math.PI * 2,
          color,
        };
      });
      const clock = { t: 0 };
      const drawDust = (t) => {
        dg.clearRect(0, 0, DW, DH);
        for (const m of motes) {
          const px = ((m.x + t * m.vx + Math.sin(t * 0.9 + m.phase) * 10) % DW + DW) % DW;
          const py = ((m.y + t * m.vy) % DH + DH) % DH;
          const a = (0.16 + 0.34 * (0.5 + 0.5 * Math.sin(t * 2.1 + m.phase))).toFixed(2);
          dg.fillStyle = `rgba(${m.color},${a})`;
          dg.beginPath();
          dg.arc(px, py, m.r, 0, Math.PI * 2);
          dg.fill();
        }
      };
      drawDust(0);
      out.push(
        gsap.to(clock, {
          t: 1000,
          duration: 1000,
          ease: 'none',
          repeat: -1,
          paused: true,
          onUpdate: () => drawDust(clock.t),
        }),
      );
    }
  }

  // ── Mini-PC 3 LED (güç, ağ/disk aktivitesi, uyarı)
  out.push(
    gsap.fromTo(q('led-power'), { opacity: 0.65 }, { opacity: 1, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true }),
  );
  const netLed = q('led-net');
  const netTl = gsap.timeline({ repeat: -1, paused: true });
  for (let i = 0, t = 0; t < 9.8; i++) {
    const val = rand(i + 808) < 0.35 ? 0.14 : 0.45 + rand(i + 909) * 0.55;
    netTl.set(netLed, { opacity: val }, t);
    t += 0.07 + rand(i + 1010) * 0.24;
  }
  netTl.set({}, {}, 10);
  out.push(netTl);

  const alertLedTl = gsap
    .timeline({ repeat: -1, paused: true })
    .set(alertLed, { opacity: 0.15 }, 0)
    .to(alertLed, { opacity: 0.95, duration: 0.08 }, 3.6)
    .to(alertLed, { opacity: 0.2, duration: 0.12 }, 3.72)
    .to(alertLed, { opacity: 0.9, duration: 0.08 }, 3.92)
    .to(alertLed, { opacity: 0.15, duration: 0.35 }, 4.04)
    .set({}, {}, 4.8);
  out.push(alertLedTl);

  // ── Klavyede canlı yazma parıltısı (3 hızlı patlama serisi)
  const keySparks = [...root.querySelectorAll('[data-fx="key-spark"]')];
  if (keySparks.length) {
    const typeTl = gsap.timeline({ repeat: -1, paused: true });
    [
      [0.35, 1.9],
      [3.0, 4.4],
      [5.7, 7.6],
    ].forEach(([start, end], bIdx) => {
      let kt = start;
      for (let k = 0; kt < end; k++) {
        const sp = keySparks[Math.floor(rand(k + bIdx * 97 + 1400) * keySparks.length)];
        typeTl
          .set(sp, { opacity: 0.85 }, kt)
          .to(sp, { opacity: 0, duration: 0.16, ease: 'power1.out' }, kt + 0.03);
        kt += 0.09 + rand(k + bIdx * 53 + 1700) * 0.12;
      }
    });
    typeTl.set({}, {}, 9);
    out.push(typeTl);
  }

  // ── Ana monitörde ince cam yansıması + Kali Plymouth ejderha parıltı döngüsü
  const sheen = root.ownerSVGElement?.querySelector('[data-fx="screen-sheen"]');
  if (sheen) {
    out.push(
      gsap.fromTo(sheen, { x: 0 }, { x: SCREEN.width + 320, duration: 2.8, ease: 'sine.inOut', repeat: -1, repeatDelay: 6.2, paused: true }),
    );
  }
  const loopSweeps = root.ownerSVGElement?.querySelectorAll('[data-fx="dragon-loop-sweep"]');
  if (loopSweeps?.length) {
    out.push(
      gsap.fromTo(
        loopSweeps,
        { x: 0 },
        { x: SCREEN.width + 320, duration: 1.85, ease: 'power1.inOut', delay: 1.7, repeat: -1, repeatDelay: 2.1, paused: true },
      ),
    );
  }

  return { tweens: out, tall, tv };
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
  const titleParallaxRef = useRef(null);
  const loginRef = useRef(null);
  const bootRef = useRef(null);
  const fxRef = useRef(null);
  const hintRef = useRef(null);
  const screenFullRef = useRef(null);
  const roomDimRef = useRef(null);
  const blueprintRef = useRef(null);
  const renkScanRef = useRef(null);
  const hotspotsRef = useRef(null);
  const tallCtrlRef = useRef(null);
  const tvCtrlRef = useRef(null);
  const stRef = useRef(null);
  const tlRef = useRef(null);
  const stopAutoRef = useRef(null);
  const [sfxOn, setSfxOn] = useState(() => isSfxEnabled());
  const [phaseIdx, setPhaseIdx] = useState(0);
  const phaseIdxRef = useRef(0);
  const currentPhaseRef = useRef('lines');

  useEffect(() => subscribeSfx(setSfxOn), []);

  const scrollToStage = (idx) => {
    stopAutoRef.current?.();
    const st = stRef.current;
    const tl = tlRef.current;
    if (!st || !tl) return;
    const dur = tl.duration() || 1;
    let y;
    if (idx === 3) {
      const desktopSt = ScrollTrigger.getById('desktop-pin');
      y = desktopSt ? desktopSt.start + (desktopSt.end - desktopSt.start) * 0.96 : st.end + 40;
    } else {
      const targetTime =
        idx === 0
          ? (tl.labels.dur ?? 4)
          : idx === 1
            ? (tl.labels.renk ?? 8) + 2.75
            : (tl.labels.giris ?? 14) + 2.2;
      y = st.start + (Math.min(targetTime, dur) / dur) * (st.end - st.start);
    }
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.25 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

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
        if (blueprintRef.current) gsap.set(blueprintRef.current, { opacity: 1 });

        const mkG = (attrs = {}) => {
          const g = document.createElementNS(SVG_NS, 'g');
          Object.entries(attrs).forEach(([k, v]) => g.setAttribute(k, v));
          return g;
        };

        // Karakter grubunu sandalye arkasını maskeleyen sabit clipPath içine sar (sandalye yerinde durur, karakter oturur).
        const drawingPerson = drawing.querySelector('[data-actor="person"]');
        if (drawingPerson) {
          const personClip = mkG({ 'clip-path': 'url(#chair-back-clip)' });
          drawingPerson.replaceWith(personClip);
          personClip.appendChild(drawingPerson);
        }
        const drawingHood = drawing.querySelector('[data-actor="person-hood"]');
        const drawingChair = drawing.querySelector('[data-actor="chair"]');

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

            const makeActorLayers = (rootLayer) => {
              const chair = mkG();
              const personClip = mkG({ 'clip-path': 'url(#chair-back-clip)' });
              const person = mkG();
              const body = mkG();
              const hood = mkG();
              person.append(body, hood);
              personClip.append(person);
              rootLayer.append(chair, personClip);
              return { chair, person, body, hood };
            };
            const haloActors = makeActorLayers(halos);
            const coreActors = makeActorLayers(cores);

            const items = [...drawing.querySelectorAll('path')]
              .map((path, i) => {
                const d = path.getAttribute('d');
                const m = d.match(START);
                if (!m) return null;
                const s = { x: +m[1], y: +m[2] };

                probe.setAttribute('d', d);
                const contour = probe.getTotalLength();

                const isStandingOnly = path.dataset.standingOnly === 'true';
                const inHood = !!path.closest('[data-actor="person-hood"]');
                const inBody = !!path.closest('[data-actor="person-body"]');
                const isPerson = inHood || inBody;
                const inChair = !!path.closest('[data-actor="chair"]');

                let pulse = null;
                if (!isStandingOnly) {
                  const halo = document.createElementNS(SVG_NS, 'path');
                  halo.setAttribute('d', d);
                  const core = halo.cloneNode();
                  if (inHood) {
                    haloActors.hood.appendChild(halo);
                    coreActors.hood.appendChild(core);
                  } else if (inBody) {
                    haloActors.body.appendChild(halo);
                    coreActors.body.appendChild(core);
                  } else if (inChair) {
                    haloActors.chair.appendChild(halo);
                    coreActors.chair.appendChild(core);
                  } else {
                    halos.appendChild(halo);
                    cores.appendChild(core);
                  }
                  pulse = [halo, core];
                }

                // Kenardaki giriş noktası + S eğrisi + asıl kontur tek yol olur;
                // dashoffset kayınca görünen parça kenardan yılan gibi kayıp yerine oturur.
                const e = perimeterPoint(box, i * GOLDEN + rand(i) * 0.08, isPerson ? 240 : 60);
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
                return { path, pulse, contour, step, from: contour + 1, to: -(lead - 0.5), push, isPerson, isStandingOnly };
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

              if (it.pulse) {
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
              }
            });

            // ── Karakterin ayaktan sandalyeye oturması: son çizgi yerine otururken tam yerine yerleşir ──
            const personGroups = [drawingPerson, haloActors.person, coreActors.person].filter(Boolean);
            const hoodGroups = [drawingHood, haloActors.hood, coreActors.hood].filter(Boolean);
            const chairGroups = [drawingChair, haloActors.chair, coreActors.chair].filter(Boolean);
            const standingOnlyPaths = [...drawing.querySelectorAll('[data-standing-only="true"]')];

            if (personGroups.length) {
              const personFirstIdx = items.findIndex((it) => it.isPerson);
              const personFirstAt = 0.3 + Math.max(personFirstIdx, 0) * gap;
              const lastLineEnd = 0.3 + Math.max(items.length - 1, 0) * gap + 1.4;
              const sitStart = personFirstAt + 1.25;
              const sitEnd = lastLineEnd - 0.05;
              const sitDur = Math.max(sitEnd - sitStart, 2.2);

              const pInit = {
                x: narrow ? -16 : -26,
                y: narrow ? -115 : -145,
                scaleX: narrow ? 0.94 : 0.92,
                scaleY: narrow ? 1.07 : 1.09,
                rotation: -2.8,
                svgOrigin: '360 760',
              };
              const hInit = { y: -10, rotation: 2.2, svgOrigin: '365 560' };
              const cInit = { x: -4, y: -8, rotation: 0.9, svgOrigin: '318 780' };

              gsap.set(personGroups, pInit);
              gsap.set(hoodGroups, hInit);
              gsap.set(chairGroups, cInit);
              gsap.set(standingOnlyPaths, { strokeOpacity: 0.72 });
              tl.set(personGroups, pInit, 0)
                .set(hoodGroups, hInit, 0)
                .set(chairGroups, cInit, 0)
                .set(standingOnlyPaths, { strokeOpacity: 0.72 }, 0);

              // Aşama 1: öne hafif eğilme / diz kırma
              tl.to(
                personGroups,
                {
                  x: narrow ? -9 : -14,
                  y: narrow ? -82 : -102,
                  scaleX: 0.95,
                  scaleY: 1.05,
                  rotation: -3.8,
                  duration: sitDur * 0.28,
                  ease: 'sine.inOut',
                },
                sitStart,
              ).to(hoodGroups, { y: -5, rotation: 3.4, duration: sitDur * 0.28, ease: 'sine.inOut' }, sitStart);

              // Aşama 2: sandalyeye iniş + ikincil kapüşon takibi + koltuğun hafif çökmesi
              const tDrop = sitStart + sitDur * 0.28;
              tl.to(
                personGroups,
                {
                  x: 2,
                  y: 6,
                  scaleX: 1.015,
                  scaleY: 0.985,
                  rotation: 0.7,
                  duration: sitDur * 0.5,
                  ease: 'power2.inOut',
                },
                tDrop,
              )
                .to(hoodGroups, { y: 4, rotation: -0.9, duration: sitDur * 0.5, ease: 'power2.inOut' }, tDrop + 0.08)
                .to(chairGroups, { x: 0, y: 5, rotation: -0.4, duration: sitDur * 0.2, ease: 'power2.in' }, sitStart + sitDur * 0.6)
                .to(standingOnlyPaths, { strokeOpacity: 0, duration: sitDur * 0.45, ease: 'power1.in' }, sitStart + sitDur * 0.35);

              // Aşama 3: yumuşak yerleşme → tam son çizgide (0, 0, 1, 1, 0)
              const tSettle = sitStart + sitDur * 0.78;
              tl.to(
                personGroups,
                { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: sitDur * 0.22, ease: 'power2.out' },
                tSettle,
              )
                .to(
                  hoodGroups,
                  { y: 0, rotation: 0, duration: Math.max(sitDur * 0.22 - 0.08, 0.15), ease: 'sine.out' },
                  tSettle + 0.08,
                )
                .to(chairGroups, { x: 0, y: 0, rotation: 0, duration: sitDur * 0.22, ease: 'power2.out' }, tSettle);
            }

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
            tl.to([scene, blueprintRef.current].filter(Boolean), { opacity: 0, duration: 3, ease: 'power1.inOut' }, 'renk');
            tl.fromTo(color, { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power1.inOut' }, 'renk+=0.3');
            if (renkScanRef.current) {
              gsap.set(renkScanRef.current, { y: -80, opacity: 0 });
              tl.set(renkScanRef.current, { opacity: 0.9 }, 'renk')
                .fromTo(renkScanRef.current, { y: -80 }, { y: 940, duration: 2.35, ease: 'power1.inOut' }, 'renk')
                .set(renkScanRef.current, { opacity: 0 }, 'renk+=2.36');
            }
            tl.to({}, { duration: 0.6 });
            const wakeBar = stageRef.current?.querySelector('[data-fx="screen-wake-bar"]');
            const wakeGlow = stageRef.current?.querySelector('[data-fx="screen-wake-glow"]');
            if (wakeBar) {
              tl.fromTo(
                wakeBar,
                { opacity: 0, scaleY: 1, svgOrigin: `${SCREEN.x + SCREEN.width / 2} ${SCREEN.y + SCREEN.height / 2}` },
                { opacity: 0.85, scaleY: 42, duration: 0.45, ease: 'power2.out' },
                'renk+=0.35',
              ).to(wakeBar, { opacity: 0, duration: 0.45, ease: 'power1.in' }, 'renk+=0.8');
            }
            if (wakeGlow) {
              tl.fromTo(wakeGlow, { opacity: 0 }, { opacity: 0.35, duration: 0.3, ease: 'power1.out' }, 'renk+=0.35').to(
                wakeGlow,
                { opacity: 0, duration: 0.7, ease: 'power1.inOut' },
                'renk+=0.65',
              );
            }
            const wakeSweeps = stageRef.current?.querySelectorAll('[data-fx="dragon-wake-sweep"]');
            if (wakeSweeps?.length) {
              gsap.set(wakeSweeps, { x: 0, opacity: 0 });
              tl.set(wakeSweeps, { opacity: 0.95 }, 'renk+=0.45')
                .fromTo(wakeSweeps, { x: 0 }, { x: SCREEN.width + 320, duration: 1.55, ease: 'power1.inOut' }, 'renk+=0.45')
                .set(wakeSweeps, { opacity: 0 }, 'renk+=2.02');
            }
            const rimRightWake = stageRef.current?.querySelector('[data-fx="rim-right"]');
            if (rimRightWake) {
              tl.to(rimRightWake, { opacity: 0.72, duration: 0.3, ease: 'power1.out' }, 'renk+=0.35').to(
                rimRightWake,
                { opacity: 0.26, duration: 0.6, ease: 'power1.inOut' },
                'renk+=0.65',
              );
            }

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

            // ── 4. aşama: oturum açılır — giriş ekranı yumuşakça bulanıklaşıp kararır,
            // siyah geçiş anında systemd [ OK ] boot satırları akar ve tam siyahken masaüstüne devredilir.
            tl.addLabel('cikis');
            tl.to(loginRef.current, { autoAlpha: 0, scale: 1.04, filter: 'blur(8px)', duration: 1.8, ease: 'power1.inOut' }, 'cikis');
            tl.to({}, { duration: 0.6 });
            const bootLines = bootRef.current ? [...bootRef.current.querySelectorAll('[data-boot]')] : [];
            if (bootRef.current && bootLines.length) {
              gsap.set(bootRef.current, { autoAlpha: 0 });
              gsap.set(bootLines, { autoAlpha: 0, y: 4 });
              tl.set(bootRef.current, { autoAlpha: 1 }, 'cikis+=0.85');
              bootLines.forEach((line, idx) =>
                tl.to(line, { autoAlpha: 1, y: 0, duration: 0.12, ease: 'power1.out' }, `cikis+=${(0.85 + idx * 0.14).toFixed(2)}`),
              );
              tl.to(bootRef.current, { autoAlpha: 0, duration: 0.4, ease: 'power1.in' }, 'cikis+=1.85');
            }

            const life = screenLife(fxRef.current, narrow);
            photoLife.push(...life.tweens);
            tallCtrlRef.current = life.tall;
            tvCtrlRef.current = life.tv;

            // Masaüstü farede hafif 2D derinlik (zoom başlayınca pürüzsüzce sıfırlanır)
            let applyParallax = null;
            let onPointerMove = null;
            let onMouseLeave = null;
            const zoomStart = tl.labels.zoom;
            if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && contentRef.current && titleParallaxRef.current) {
              const setCX = gsap.quickTo(contentRef.current, 'x', { duration: 0.75, ease: 'power2.out' });
              const setCY = gsap.quickTo(contentRef.current, 'y', { duration: 0.75, ease: 'power2.out' });
              const setCS = gsap.quickTo(contentRef.current, 'scale', { duration: 0.75, ease: 'power2.out' });
              const setTX = gsap.quickTo(titleParallaxRef.current, 'x', { duration: 0.75, ease: 'power2.out' });
              const setTY = gsap.quickTo(titleParallaxRef.current, 'y', { duration: 0.75, ease: 'power2.out' });
              const pointer = { nx: 0, ny: 0 };
              applyParallax = (t) => {
                const amp = t < zoomStart ? 1 : Math.max(0, 1 - (t - zoomStart) / 1.4);
                if (amp <= 0.001) {
                  setCX(0);
                  setCY(0);
                  setCS(1);
                  setTX(0);
                  setTY(0);
                  return;
                }
                setCX(-pointer.nx * 6 * amp);
                setCY(-pointer.ny * 4 * amp);
                setCS(1 + 0.012 * amp);
                setTX(pointer.nx * 4 * amp);
                setTY(pointer.ny * 2.5 * amp);
              };
              onPointerMove = (e) => {
                if (e.pointerType !== 'mouse') return;
                pointer.nx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
                pointer.ny = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
                applyParallax(tl.time());
              };
              onMouseLeave = () => {
                pointer.nx = 0;
                pointer.ny = 0;
                applyParallax(tl.time());
              };
              window.addEventListener('pointermove', onPointerMove, { passive: true });
              document.addEventListener('mouseleave', onMouseLeave);
            }

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
              if (hotspotsRef.current) {
                hotspotsRef.current.style.pointerEvents = photo && t < zoomStart + 0.35 ? 'auto' : 'none';
              }
              state.lines = lines;
              state.photo = photo;
              const sfxPhase = lines ? 'lines' : photo ? 'room' : t >= tl.labels.giris && t < tl.labels.cikis ? 'login' : 'off';
              currentPhaseRef.current = sfxPhase;
              setSfxPhase(sfxPhase);
              const nextStage = t < tl.labels.renk ? 0 : t < tl.labels.giris ? 1 : t < tl.labels.cikis ? 2 : 3;
              if (nextStage !== phaseIdxRef.current) {
                phaseIdxRef.current = nextStage;
                setPhaseIdx(nextStage);
              }
              applyParallax?.(t);
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
            stRef.current = st;
            tlRef.current = tl;

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
              stopAutoRef.current = stopAuto;
              ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((e) => window.addEventListener(e, stopAuto, { passive: true }));
            }

            return () => {
              if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
              if (onMouseLeave) document.removeEventListener('mouseleave', onMouseLeave);
            };
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

  const dragonGlowLayer = (
    <>
      <g mask="url(#kali-dragon-mask)" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
        <rect
          data-fx="dragon-wake-sweep"
          x={SCREEN.x - 240}
          y={SCREEN.y - 30}
          width="220"
          height={SCREEN.height + 60}
          fill="url(#kali-sweep-grad)"
          opacity="0"
        />
        <rect
          data-fx="dragon-loop-sweep"
          x={SCREEN.x - 240}
          y={SCREEN.y - 30}
          width="220"
          height={SCREEN.height + 60}
          fill="url(#kali-sweep-grad)"
          opacity="0.88"
        />
      </g>
      <g filter="url(#kali-dragon-bloom)" opacity="0.82" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
        <g mask="url(#kali-dragon-mask)">
          <rect
            data-fx="dragon-wake-sweep"
            x={SCREEN.x - 240}
            y={SCREEN.y - 30}
            width="220"
            height={SCREEN.height + 60}
            fill="url(#kali-sweep-grad)"
            opacity="0"
          />
          <rect
            data-fx="dragon-loop-sweep"
            x={SCREEN.x - 240}
            y={SCREEN.y - 30}
            width="220"
            height={SCREEN.height + 60}
            fill="url(#kali-sweep-grad)"
            opacity="0.88"
          />
        </g>
      </g>
    </>
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
              <clipPath id="chair-back-clip">
                <path d="M -400 -400 H 2000 V 1200 H 585 L 569 814 L 536 794 L 491 781 L 433 771 L 340 765 L 146 763 L 94 769 L 67 779 L 55 920 H -400 Z" />
              </clipPath>
              <filter id="kali-mask-boost" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="0 0 1.55 0 -0.12  0 0 1.55 0 -0.12  0 0 1.55 0 -0.12  0 0 0 1 0" />
              </filter>
              <filter id="kali-dragon-bloom" x="-15%" y="-15%" width="130%" height="130%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <linearGradient id="kali-sweep-grad" x1="0" y1="0" x2="1" y2="0.28">
                <stop offset="0%" stopColor="#1f6fff" stopOpacity="0" />
                <stop offset="24%" stopColor="#2da8ff" stopOpacity="0.48" />
                <stop offset="46%" stopColor="#b8f0ff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="58%" stopColor="#5ce1ff" stopOpacity="0.85" />
                <stop offset="80%" stopColor="#2d8cff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1f6fff" stopOpacity="0" />
              </linearGradient>
              <mask id="kali-dragon-mask" maskUnits="userSpaceOnUse" x={SCREEN.x} y={SCREEN.y} width={SCREEN.width} height={SCREEN.height}>
                <rect {...SCREEN} fill="#000" />
                <image href={SCREEN_IMG} {...SCREEN} preserveAspectRatio="xMidYMid meet" filter="url(#kali-mask-boost)" />
                <rect x="515" y="565" width="90" height="42" fill="#000" />
              </mask>
              <radialGradient id="hero-bp-aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4a2896" stopOpacity="0.2" />
                <stop offset="55%" stopColor="#1e3a8a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hero-renk-scan-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
                <stop offset="65%" stopColor="#5ee6ff" stopOpacity="0.24" />
                <stop offset="96%" stopColor="#dff8ff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
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
                  <clipPath id="fx-screen">
                    <rect {...SCREEN} />
                  </clipPath>
                  <pattern id="fx-scan" patternUnits="userSpaceOnUse" width="4" height="2.4">
                    <rect width="4" height="1" fill="#000" />
                  </pattern>
                  <linearGradient id="fx-bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#dfffff" stopOpacity="0" />
                    <stop offset="0.6" stopColor="#dfffff" stopOpacity="0.13" />
                    <stop offset="1" stopColor="#dfffff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="fx-screen-sheen" x1="0" y1="0" x2="1" y2="0.4">
                    <stop offset="0" stopColor="#d2ebff" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#d2ebff" stopOpacity="0.08" />
                    <stop offset="1" stopColor="#d2ebff" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="fx-glow-cctv" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#5ee6ff" stopOpacity="0.34" />
                    <stop offset="45%" stopColor="#28c8a0" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-glow-tv-radar" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6effbe" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#20a878" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-glow-tv-signal" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7fe0ff" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#4c7fff" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-glow-tv-live" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d47aff" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#ff4678" stopOpacity="0.11" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-glow-tv-static" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d0e8ff" stopOpacity="0.24" />
                    <stop offset="50%" stopColor="#8ab0d8" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-glow-tall" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8a7dff" stopOpacity="0.28" />
                    <stop offset="48%" stopColor="#4598ff" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-glow-desk" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6a88ff" stopOpacity="0.26" />
                    <stop offset="45%" stopColor="#9a6bff" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-led-cyan" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#9effdb" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#38e8b0" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-led-blue" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a8e2ff" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#4f9eff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-led-alert" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff7aa8" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#c46bff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fx-key-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a5e4ff" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#9a6bff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="hero-glow-ambi" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6f8fff" stopOpacity="0.34" />
                    <stop offset="48%" stopColor="#9a6bff" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="hero-glow-ambi-alert" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff4d7d" stopOpacity="0.46" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="hero-key-wave-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5ee6ff" stopOpacity="0" />
                    <stop offset="35%" stopColor="#5ee6ff" stopOpacity="0.22" />
                    <stop offset="55%" stopColor="#c4a1ff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#c4a1ff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="hero-desk-sheen-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a5d8ff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#c4e6ff" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#a5d8ff" stopOpacity="0" />
                  </linearGradient>
                  <clipPath id="hero-kb-clip">
                    <rect x="655" y="710" width="420" height="52" rx="6" />
                  </clipPath>
                  <clipPath id="hero-desk-front-clip">
                    <rect x="460" y="790" width="780" height="32" rx="4" />
                  </clipPath>
                  <filter id="fx-rim-blur" x="-15%" y="-15%" width="130%" height="130%">
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </defs>

                {/* Oda içi ekran ışık taşması ve masa parıltısı */}
                <g style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
                  <ellipse data-fx="spill-ambilight" cx="845" cy="245" rx="480" ry="155" fill="url(#hero-glow-ambi)" opacity="0.4" />
                  <ellipse data-fx="spill-ambilight-alert" cx="845" cy="245" rx="460" ry="150" fill="url(#hero-glow-ambi-alert)" opacity="0" />
                  <ellipse data-fx="spill-cctv" cx="220" cy="225" rx="260" ry="215" fill="url(#fx-glow-cctv)" opacity="0.52" />
                  <ellipse data-fx="spill-tv-radar" cx="140" cy="490" rx="210" ry="175" fill="url(#fx-glow-tv-radar)" opacity="0.58" />
                  <ellipse data-fx="spill-tv-signal" cx="140" cy="490" rx="210" ry="175" fill="url(#fx-glow-tv-signal)" opacity="0" />
                  <ellipse data-fx="spill-tv-live" cx="140" cy="490" rx="210" ry="175" fill="url(#fx-glow-tv-live)" opacity="0" />
                  <ellipse data-fx="spill-tv-static" cx="140" cy="490" rx="210" ry="175" fill="url(#fx-glow-tv-static)" opacity="0" />
                  <ellipse data-fx="spill-tall" cx="1370" cy="495" rx="230" ry="300" fill="url(#fx-glow-tall)" opacity="0.48" />
                  <g data-fx="spill-desk" opacity="0.46">
                    <ellipse cx="855" cy="738" rx="285" ry="62" fill="url(#fx-glow-desk)" />
                    <ellipse cx="1188" cy="744" rx="58" ry="34" fill="url(#fx-glow-tall)" />
                  </g>
                </g>

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

                {/* Sağ monitör altındaki mini-PC'nin 3 gerçek LED'i */}
                <g style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
                  <g data-fx="led-power" opacity="0.85">
                    <circle cx="1292" cy="688.3" r="11" fill="url(#fx-led-cyan)" />
                    <circle cx="1292" cy="688.3" r="1.5" fill="#b5ffe4" />
                  </g>
                  <g data-fx="led-net" opacity="0.7">
                    <circle cx="1281.7" cy="687.5" r="10" fill="url(#fx-led-blue)" />
                    <circle cx="1281.7" cy="687.5" r="1.35" fill="#b8e8ff" />
                  </g>
                  <g data-fx="led-alert" opacity="0.15">
                    <circle cx="1275" cy="687.5" r="9" fill="url(#fx-led-alert)" />
                    <circle cx="1275" cy="687.5" r="1.25" fill="#ff8ab4" />
                  </g>
                </g>

                {/* Klavyede canlı yazma parıltısı + RGB dalga + fare + kablo veri atımı */}
                <g style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
                  <g clipPath="url(#hero-kb-clip)">
                    <rect data-fx="key-wave" x="655" y="710" width="160" height="52" fill="url(#hero-key-wave-grad)" />
                  </g>
                  <g clipPath="url(#hero-desk-front-clip)">
                    <rect data-fx="desk-sheen" x="460" y="790" width="220" height="32" fill="url(#hero-desk-sheen-grad)" opacity="0.7" />
                  </g>
                  <circle data-fx="mouse-glint" cx="1188" cy="746" r="22" fill="url(#fx-led-blue)" opacity="0.32" />
                  <path
                    data-fx="cable-pulse-1"
                    d="M 1060 651 L 1079 656 L 1097 673 L 1138 676 L 1190 676 L 1265 688"
                    fill="none"
                    stroke="#5ee6ff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.82"
                  />
                  <path
                    data-fx="cable-pulse-2"
                    d="M 1060 651 L 1079 656 L 1097 673 L 1138 676 L 1190 676 L 1265 688"
                    fill="none"
                    stroke="#c4a1ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <ellipse data-fx="key-spark" cx="705" cy="736" rx="16" ry="7" fill="url(#fx-key-glow)" opacity="0" />
                  <ellipse data-fx="key-spark" cx="768" cy="728" rx="16" ry="7" fill="url(#fx-key-glow)" opacity="0" />
                  <ellipse data-fx="key-spark" cx="825" cy="740" rx="16" ry="7" fill="url(#fx-key-glow)" opacity="0" />
                  <ellipse data-fx="key-spark" cx="888" cy="730" rx="16" ry="7" fill="url(#fx-key-glow)" opacity="0" />
                  <ellipse data-fx="key-spark" cx="948" cy="742" rx="16" ry="7" fill="url(#fx-key-glow)" opacity="0" />
                  <ellipse data-fx="key-spark" cx="1012" cy="732" rx="16" ry="7" fill="url(#fx-key-glow)" opacity="0" />
                </g>

                {/* Monitör ışık konilerinde yüzen mikro toz tanecikleri */}
                <foreignObject x="0" y="0" width="1600" height="900" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
                  <canvas data-fx="dust-canvas" style={{ display: 'block', width: 1600, height: 900 }} />
                </foreignObject>

                {/* Etkileşimli yan ekranlar: TV kanal değiştir + sağ dikey IDE sekme değiştir (yalnız oda fazında) */}
                <g ref={hotspotsRef} style={{ pointerEvents: 'none' }}>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Sol alt TV kanalını değiştir"
                    className="hero-hotspot cursor-pointer focus:outline-none"
                    onClick={() => {
                      tvCtrlRef.current?.nextChannel?.();
                      playStaticTick();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        tvCtrlRef.current?.nextChannel?.();
                        playStaticTick();
                      }
                    }}
                  >
                    <rect {...TV} rx="9" fill="transparent" />
                    <g className="hero-hotspot-ui" pointerEvents="none">
                      <rect {...TV} rx="9" fill="none" stroke="#6effbe" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="6 4" />
                      <rect x={TV.x + 8} y={TV.y + 8} width="54" height="18" rx="4" fill="#04120e" fillOpacity="0.88" stroke="#6effbe" strokeOpacity="0.6" strokeWidth="1" />
                      <text x={TV.x + 35} y={TV.y + 20} textAnchor="middle" fill="#6effbe" fontSize="9.5" fontFamily="monospace" fontWeight="700">
                        CH ↻
                      </text>
                    </g>
                  </g>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label="Sağ monitörde purple_loop.py ve sigma.yml sekmeleri arasında geçiş yap"
                    className="hero-hotspot cursor-pointer focus:outline-none"
                    onClick={() => {
                      tallCtrlRef.current?.toggleTab?.();
                      playKeyClick();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        tallCtrlRef.current?.toggleTab?.();
                        playKeyClick();
                      }
                    }}
                  >
                    <rect {...TALL_BOX} fill="transparent" />
                    <g className="hero-hotspot-ui" pointerEvents="none">
                      <rect {...TALL_BOX} fill="none" stroke="#c4a1ff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="6 4" />
                      <rect x={TALL_BOX.x + 12} y={TALL_BOX.y + 12} width="70" height="20" rx="4" fill="#0d0a1a" fillOpacity="0.88" stroke="#c4a1ff" strokeOpacity="0.65" strokeWidth="1" />
                      <text x={TALL_BOX.x + 47} y={TALL_BOX.y + 25} textAnchor="middle" fill="#e4d6ff" fontSize="9.5" fontFamily="monospace" fontWeight="700">
                        TAB ⇄
                      </text>
                    </g>
                  </g>
                </g>

                {/* Kapüşon ve omuzlara düşen dinamik kenar ışığı (rim light) */}
                <g filter="url(#fx-rim-blur)" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
                  <path
                    data-fx="rim-left"
                    stroke="#6effdf"
                    strokeWidth="6"
                    opacity="0.22"
                    d="M 324 345 L 305 364 L 279 389 L 259 421 L 246 455 L 235 497 L 228 530 L 223 559 L 223 607 L 197 626 L 158 640 L 128 651 L 96 663 L 78 682 L 62 712"
                  />
                  <path
                    data-fx="rim-right"
                    stroke="#88b4ff"
                    strokeWidth="6"
                    opacity="0.26"
                    d="M 352 334 L 374 333 L 407 348 L 430 363 L 446 379 L 468 412 L 490 454 L 508 498 L 513 546 L 511 584 L 494 641 L 526 651 L 566 664 L 612 686 L 642 714"
                  />
                  <path
                    data-fx="rim-right-alert"
                    stroke="#ff5a8c"
                    strokeWidth="7"
                    opacity="0"
                    d="M 352 334 L 374 333 L 407 348 L 430 363 L 446 379 L 468 412 L 490 454 L 508 498 L 513 546 L 511 584 L 494 641 L 526 651 L 566 664 L 612 686 L 642 714"
                  />
                </g>
              </g>
              {/* Ana monitörün ekranı: siyah zemin + ejderha; kapüşonun arkasında kalan kısım maskeyle gizli. */}
              <g mask="url(#ekran-maske)">
                <rect {...SCREEN} fill="#000" />
                <image href={SCREEN_IMG} {...SCREEN} preserveAspectRatio="xMidYMid meet" />
                <g clipPath="url(#fx-screen)">
                  {dragonGlowLayer}
                  <rect data-fx="screen-wake-glow" {...SCREEN} fill="#88d8ff" opacity="0" style={{ mixBlendMode: 'screen' }} />
                  <rect
                    data-fx="screen-wake-bar"
                    x={SCREEN.x}
                    y={SCREEN.y + SCREEN.height / 2 - 2}
                    width={SCREEN.width}
                    height="4"
                    fill="#e6f9ff"
                    opacity="0"
                    style={{ mixBlendMode: 'screen' }}
                  />
                  <rect
                    data-fx="screen-sheen"
                    x={SCREEN.x - 280}
                    y={SCREEN.y - 40}
                    width="260"
                    height={SCREEN.height + 80}
                    fill="url(#fx-screen-sheen)"
                    opacity="0.55"
                    style={{ mixBlendMode: 'screen' }}
                  />
                </g>
              </g>
              {/* Zoom sırasında ekran maskesiz haliyle belirir: kapüşon ekranla birlikte büyüyüp önünü kapatmasın. */}
              {/* Zoom'da oda (kapüşon dahil) kararır, sadece ekran aydınlık kalır. */}
              <path
                ref={roomDimRef}
                fillRule="evenodd"
                fill="#000"
                opacity="0"
                style={{ pointerEvents: 'none' }}
                d={`M-2000 -2000 H3600 V2900 H-2000 Z M${SCREEN.x} ${SCREEN.y} h${SCREEN.width} v${SCREEN.height} h${-SCREEN.width} Z`}
              />
              <g ref={screenFullRef} opacity="0" style={{ pointerEvents: 'none' }}>
                <rect {...SCREEN} fill="#000" />
                <image href={SCREEN_IMG} {...SCREEN} preserveAspectRatio="xMidYMid meet" />
                <g clipPath="url(#fx-screen)">{dragonGlowLayer}</g>
              </g>
              <rect ref={screenRef} {...SCREEN} fill="none" style={{ pointerEvents: 'none' }} />
            </g>
            {/* Çizim aşaması: ince siber blueprint ızgarası & derin mor nebula (renk gelince söner) */}
            <g ref={blueprintRef} style={{ pointerEvents: 'none' }}>
              <circle cx="846" cy="418" r="620" fill="url(#hero-bp-aura)" />
              <g stroke="#8ca8ff" strokeOpacity="0.055" strokeWidth="1">
                {Array.from({ length: 19 }, (_, i) => (
                  <path key={`bv${i}`} d={`M ${(i + 1) * 80} 0 V 900`} />
                ))}
                {Array.from({ length: 11 }, (_, i) => (
                  <path key={`bh${i}`} d={`M 0 ${(i + 1) * 80} H 1600`} />
                ))}
              </g>
              <g stroke="#a78bfa" strokeOpacity="0.22" strokeWidth="1.2">
                <path d="M 48 64 h 24 M 60 52 v 24" />
                <path d="M 1528 64 h 24 M 1540 52 v 24" />
                <path d="M 48 836 h 24 M 60 824 v 24" />
                <path d="M 1528 836 h 24 M 1540 824 v 24" />
              </g>
            </g>
            <g ref={sceneRef} style={{ pointerEvents: 'none' }} />
            {/* Çizim → Renk geçişi holografik lazer tarama bandı */}
            <g ref={renkScanRef} opacity="0" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
              <rect x="-100" y="-70" width="1800" height="70" fill="url(#hero-renk-scan-grad)" />
              <line x1="-100" y1="0" x2="1700" y2="0" stroke="#e4fbff" strokeWidth="2.5" />
            </g>
          </svg>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_95%_at_50%_50%,transparent_58%,rgba(0,0,0,0.42)_100%)]"
          aria-hidden="true"
        />

        <KaliLogin ref={loginRef} />

        {/* Systemd [ OK ] boot geçiş katmanı (girişten masaüstüne siyah ekranda akar) */}
        <div
          ref={bootRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-0 z-[15] flex items-center justify-center px-6 opacity-0"
        >
          <div className="w-full max-w-lg space-y-1 font-mono text-[11px] leading-6 text-white/80 sm:text-xs">
            {[
              'Started purple-loop.service — Red/Blue Detection Engine.',
              'Started siem-agent.service — CRT-01 Telemetry Sensor.',
              'Mounted /home/onur/projeler (6 repositories).',
              'Started xfce4-session — Kali Purple Workstation.',
              'Reached target Graphical Interface.',
            ].map((msg) => (
              <p key={msg} data-boot className="invisible opacity-0">
                <span className="text-white/45">[</span>
                <span className="text-[#5fb87a]">  OK  </span>
                <span className="text-white/45">]</span> {msg}
              </p>
            ))}
          </div>
        </div>

        <div
          ref={titleRef}
          className="pointer-events-none invisible absolute left-6 top-8 max-w-sm opacity-0 sm:left-12 sm:top-14"
        >
          <div ref={titleParallaxRef}>
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

        {/* Sağ kenar 4 aşamalı bölüm göstergesi */}
        <nav
          aria-label="Sahne aşamaları"
          className="pointer-events-auto absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-2.5 sm:flex md:right-6"
        >
          {[
            ['01', 'Çizim'],
            ['02', 'Oda'],
            ['03', 'Giriş'],
            ['04', 'Masaüstü'],
          ].map(([num, lbl], idx) => {
            const active = phaseIdx === idx;
            return (
              <button
                key={num}
                type="button"
                onClick={() => scrollToStage(idx)}
                className="group flex items-center gap-2 py-0.5 font-mono text-[10px] tracking-[0.18em] focus:outline-none"
              >
                <span
                  className={`transition-all duration-200 ${
                    active ? 'text-white/85 opacity-100' : 'text-white/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  }`}
                >
                  {num} {lbl}
                </span>
                <span
                  className={`h-2 w-2 rounded-full border transition-all duration-200 ${
                    active
                      ? 'scale-125 border-[#c4a1ff] bg-[#a78bfa] shadow-[0_0_10px_#a78bfa]'
                      : 'border-white/30 bg-white/15 group-hover:border-white/70 group-hover:bg-white/40'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Alt sol: Masaüstüne Atla kısayolu */}
        <button
          type="button"
          onClick={() => scrollToStage(3)}
          aria-label="Doğrudan Kali Linux masaüstüne atla"
          className="pointer-events-auto absolute bottom-5 left-5 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-white/70 backdrop-blur-md transition hover:border-[#a78bfa]/60 hover:text-white sm:bottom-8 sm:left-8"
        >
          <span>Masaüstüne Atla</span>
          <span className="text-[#c4a1ff]">↓</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const next = toggleSfx();
            setSfxOn(next);
            if (next) setSfxPhase(currentPhaseRef.current);
          }}
          aria-pressed={sfxOn}
          aria-label={sfxOn ? 'Ortam sesini kapat' : 'Ortam sesini aç'}
          className="pointer-events-auto absolute bottom-5 right-5 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-white/70 backdrop-blur-md transition hover:border-white/35 hover:text-white sm:bottom-8 sm:right-8"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sfxOn ? 'bg-[#6effbe] shadow-[0_0_8px_#6effbe]' : 'bg-white/30'}`} />
          <span>SFX: {sfxOn ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </section>
  );
}
