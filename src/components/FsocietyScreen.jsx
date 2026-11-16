import gsap from 'gsap';

// Sol üstteki eski CRT monitörün (hero'da "Ad Soyad"ın arkası) içinde dönen sahne:
// VHS karıncası üstünde art arda açılan retro pop-up pencereler — Mr. Robot / fsociety havası.
// Her şey kodla çiziliyor (dizi görüntüsü yok), metinler aşağıdaki sabitlerden değiştirilebilir.

// İç çözünürlük (ekranın 2 katı) — yazılar keskin kalsın diye büyük çizilip SVG'de yarıya ölçeklenir.
export const FS_W = 488;
export const FS_H = 402;

const FG = '#8affd0'; // fosfor yeşili
const FG2 = '#5ee6ff'; // camgöbeği
const RED = '#ff3d6e';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

const BIN = [...'hello friend fsociety are you a 1 or a 0 '].map((c) =>
  c.charCodeAt(0).toString(2).padStart(8, '0'),
);
const BIN_LINES = Array.from({ length: 10 }, (_, i) =>
  Array.from({ length: 4 }, (_, k) => BIN[(i * 4 + k) % BIN.length]).join(' '),
);

const MSG_1 = 'hello, friend.';
const MSG_2 = '> are you a 1 or a 0?';

// Pop-up penceresi: beyaz başlık çubuğu, siyah gövde, arkasında üst üste binmiş "yankı" çerçeveler.
function Win({ fx, title, style, children, bodyStyle }) {
  return (
    <div
      data-fs={fx}
      style={{
        position: 'absolute',
        opacity: 0,
        background: '#04090a',
        border: '2px solid #eef4f1',
        boxShadow:
          '5px 5px 0 -2px #04090a, 5px 5px 0 0 #c9d6d2, 10px 10px 0 -2px #04090a, 10px 10px 0 0 #93a7a1, -2px 0 0 rgba(255,40,100,.55), 2px 0 0 rgba(0,255,230,.45)',
        ...style,
      }}
    >
      <div
        style={{
          background: '#e8efec',
          color: '#0b0f0e',
          font: `700 10px/15px ${MONO}`,
          padding: '0 6px',
          display: 'flex',
          justifyContent: 'space-between',
          letterSpacing: '0.02em',
        }}
      >
        <span>{title}</span>
        <span>_ □ ✕</span>
      </div>
      <div style={{ position: 'relative', overflow: 'hidden', ...bodyStyle }}>{children}</div>
    </div>
  );
}

// Maske çizimi (özgün, çizgi sanatı): silindir şapka, kalkık kaşlar, kıvrık bıyık, geniş gülüş.
function Mask() {
  return (
    <svg viewBox="0 0 120 132" width="118" height="128" style={{ display: 'block', overflow: 'visible' }}>
      <g fill="none" stroke={FG} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 36 H96" strokeWidth="3" />
        <path d="M38 36 V9 Q60 5 82 9 V36" />
        <path d="M38 29 H82" stroke={RED} strokeWidth="3.4" />
        <path d="M32 44 C30 92 48 122 60 122 C72 122 90 92 88 44 C78 38 42 38 32 44 Z" />
        <path d="M39 57 Q47 47 55 55" />
        <path d="M65 55 Q73 47 81 57" />
        <path d="M42 65 Q48 59 55 65 Q48 69 42 65 Z" fill={FG} />
        <path d="M65 65 Q72 59 78 65 Q72 69 65 65 Z" fill={FG} />
        <path d="M60 67 L56 82 Q60 86 64 82" />
        <path d="M60 88 C53 83 43 85 38 92 C35 97 30 94 32 89" />
        <path d="M60 88 C67 83 77 85 82 92 C85 97 90 94 88 89" />
        <path d="M44 98 Q60 115 76 98" />
        <path d="M48 101 Q60 110 72 101" strokeWidth="1.4" />
      </g>
      <circle cx="40" cy="84" r="5" fill={RED} opacity="0.45" />
      <circle cx="80" cy="84" r="5" fill={RED} opacity="0.45" />
    </svg>
  );
}

// Monitörün içi (SVG'ye foreignObject ile gömülür).
export default function FsocietyScreen() {
  const glow = `0 0 6px ${FG}, -1.5px 0 0 rgba(255,40,100,.7), 1.5px 0 0 rgba(0,255,230,.6)`;
  return (
    <div
      style={{ position: 'relative', width: FS_W, height: FS_H, overflow: 'hidden', background: '#020405' }}
    >
      {/* VHS karıncası (kareleri JS üretir) */}
      <div data-fs="noise" style={{ position: 'absolute', inset: 0, backgroundSize: '100% 100%', imageRendering: 'pixelated', opacity: 0.9 }} />

      <div data-fs="stage" style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%' }}>
        {/* Arka sol: dönen halkalar */}
        <Win fx="w-rings" title="scan.exe" style={{ left: 22, top: 58, width: 128, height: 118 }}>
          <svg viewBox="0 0 100 100" width="124" height="99">
            <g fill="none" strokeWidth="5">
              <circle data-fs="ring1" cx="50" cy="50" r="38" stroke={FG2} strokeDasharray="34 12" opacity="0.85" />
              <circle data-fs="ring2" cx="50" cy="50" r="27" stroke={FG} strokeDasharray="22 9" />
              <circle data-fs="ring3" cx="50" cy="50" r="15" stroke="#e8fff6" strokeDasharray="10 7" />
            </g>
          </svg>
        </Win>

        {/* Arka sağ üst: kayan ikili döküm */}
        <Win
          fx="w-bin"
          title="fsociety00.dat"
          style={{ left: 180, top: 14, width: 262, height: 116 }}
          bodyStyle={{ height: 97 }}
        >
          <div data-fs="bin" style={{ font: `600 10.5px/14px ${MONO}`, color: '#cfe9e1', padding: '4px 8px', whiteSpace: 'pre' }}>
            {[...BIN_LINES, ...BIN_LINES].map((l, i) => (
              <div key={i} style={i % 7 === 3 ? { color: '#04090a', background: FG } : undefined}>
                {l}
              </div>
            ))}
          </div>
        </Win>

        {/* Sağ: kırmızı uyarı */}
        <Win
          fx="w-alert"
          title="warning"
          style={{ left: 336, top: 150, width: 132, height: 92 }}
          bodyStyle={{ height: 73, display: 'grid', placeItems: 'center' }}
        >
          <div data-fs="alert" style={{ font: `800 13px/16px ${MONO}`, color: RED, textAlign: 'center', textShadow: `0 0 8px ${RED}` }}>
            SYSTEM
            <br />
            BREACHED
          </div>
        </Win>

        {/* Orta: maske */}
        <Win
          fx="w-mask"
          title="fsociety.exe"
          style={{ left: 128, top: 92, width: 214, height: 196 }}
          bodyStyle={{ height: 177, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'column', filter: `drop-shadow(0 0 5px ${FG})` }}
        >
          <Mask />
          <div data-fs="title" style={{ font: `800 22px/1 ${MONO}`, color: FG, letterSpacing: '0.12em', textShadow: glow }}>
            fsociety
          </div>
        </Win>

        {/* Alt sol: mesaj */}
        <Win
          fx="w-msg"
          title="message"
          style={{ left: 20, top: 262, width: 236, height: 92 }}
          bodyStyle={{ height: 73, padding: '9px 10px', font: `600 13px/19px ${MONO}`, color: '#e9fff7' }}
        >
          <div>
            <span data-fs="msg1" />
            <span data-fs="caret" style={{ color: FG }}>█</span>
          </div>
          <div data-fs="msg2" style={{ color: FG2 }} />
        </Win>

        {/* Alt sağ: ilerleme çubuğu */}
        <Win
          fx="w-prog"
          title="uploading..."
          style={{ left: 268, top: 296, width: 196, height: 62 }}
          bodyStyle={{ height: 43, padding: '8px 9px' }}
        >
          <div style={{ display: 'flex', gap: 3, border: '1.5px solid #9fb3ad', padding: 3 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} data-fs="block" style={{ flex: 1, height: 12, background: FG, opacity: 0.08 }} />
            ))}
          </div>
        </Win>
      </div>

      {/* CRT: tarama çizgileri, kenar kararması, cam parlaması */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px), radial-gradient(120% 95% at 50% 50%, transparent 58%, rgba(0,0,0,.85) 100%), radial-gradient(60% 40% at 28% 18%, rgba(255,255,255,.07), transparent 70%)',
        }}
      />
      {/* Kapanma çizgisi (CRT power-off) */}
      <div data-fs="off" style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, marginTop: -1.5, background: '#eafff8', boxShadow: '0 0 14px #bfffee', opacity: 0 }} />
    </div>
  );
}

// Yatay renkli çizgilerden oluşan VHS karıncası kareleri.
function vhsFrames(n, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const tints = [
    [40, 150, 140],
    [90, 60, 160],
    [30, 120, 90],
    [70, 90, 150],
  ];
  const frames = [];
  for (let f = 0; f < n; f++) {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const rowGain = 0.25 + Math.random() * 0.75;
      let x = 0;
      while (x < w) {
        const run = 2 + Math.floor(Math.random() * 18);
        const t = tints[Math.floor(Math.random() * tints.length)];
        const v = Math.random() < 0.6 ? Math.random() * 0.35 : Math.random() * rowGain;
        for (let k = 0; k < run && x < w; k++, x++) {
          const i = (y * w + x) * 4;
          img.data[i] = t[0] * v;
          img.data[i + 1] = t[1] * v;
          img.data[i + 2] = t[2] * v;
          img.data[i + 3] = 255;
        }
      }
    }
    g.putImageData(img, 0, 0);
    frames.push(`url(${c.toDataURL()})`);
  }
  return frames;
}
let VHS = null;

// Zamanla dönen animasyonlar (duraklatılmış döner; HeroScene oynatır/durdurur).
export function fsocietyLife(root) {
  const q = (k) => root.querySelector(`[data-fs="${k}"]`);
  const qa = (k) => root.querySelectorAll(`[data-fs="${k}"]`);
  const out = [];

  // Karınca kareleri
  VHS ??= vhsFrames(6, 180, 150);
  const noise = q('noise');
  const fr = { f: 0 };
  let last = -1;
  out.push(
    gsap.to(fr, {
      f: VHS.length,
      duration: VHS.length / 15,
      ease: 'none',
      repeat: -1,
      paused: true,
      onUpdate: () => {
        const f = Math.floor(fr.f) % VHS.length;
        if (f !== last) noise.style.backgroundImage = VHS[f];
        last = f;
      },
    }),
  );

  // Sürekli hareket edenler: halkalar, ikili döküm, uyarı yanıp sönmesi
  out.push(gsap.to(q('ring1'), { rotation: 360, svgOrigin: '50 50', duration: 6, ease: 'none', repeat: -1, paused: true }));
  out.push(gsap.to(q('ring2'), { rotation: -360, svgOrigin: '50 50', duration: 4, ease: 'none', repeat: -1, paused: true }));
  out.push(gsap.to(q('ring3'), { rotation: 360, svgOrigin: '50 50', duration: 2.5, ease: 'none', repeat: -1, paused: true }));
  out.push(gsap.fromTo(q('bin'), { y: 0 }, { y: -BIN_LINES.length * 14, duration: 7, ease: 'none', repeat: -1, paused: true }));
  out.push(gsap.to(q('alert'), { opacity: 0.25, duration: 0.45, ease: 'steps(1)', repeat: -1, yoyo: true, paused: true }));
  out.push(gsap.to(q('caret'), { opacity: 0, duration: 0.5, ease: 'steps(1)', repeat: -1, yoyo: true, paused: true }));

  // Ana döngü: pencereler art arda açılır → mesaj yazılır → yükleme dolar → bozulma → CRT kapanır → baştan.
  const stage = q('stage');
  const wins = ['w-mask', 'w-bin', 'w-rings', 'w-alert', 'w-msg', 'w-prog'].map(q);
  const blocks = [...qa('block')];
  const msg1 = q('msg1');
  const msg2 = q('msg2');
  const off = q('off');
  const typer = (el, text) => {
    const o = { n: 0 };
    return gsap.to(o, {
      n: text.length,
      duration: text.length * 0.07,
      ease: 'none',
      onUpdate: () => (el.textContent = text.slice(0, Math.round(o.n))),
    });
  };

  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.set(stage, { scaleX: 1, scaleY: 1, x: 0, opacity: 1, filter: 'none' }, 0)
    .set(wins, { opacity: 0 }, 0)
    .set(blocks, { opacity: 0.08 }, 0)
    .set(off, { opacity: 0, scaleX: 1 }, 0)
    .set(noise, { opacity: 0.9 }, 0)
    .add(() => {
      msg1.textContent = '';
      msg2.textContent = '';
    }, 0);

  // Açılış: her pencere titreyerek belirir (önce ince bir şerit, sonra tam boy).
  wins.forEach((w, i) => {
    const at = 0.7 + i * 0.32;
    tl.set(w, { opacity: 1, scaleY: 0.06, scaleX: 1.08 }, at)
      .set(w, { scaleY: 0.6, x: 6 }, at + 0.05)
      .set(w, { opacity: 0.4, x: -4 }, at + 0.09)
      .set(w, { opacity: 1, scaleY: 1, scaleX: 1, x: 0 }, at + 0.13);
  });

  tl.add(typer(msg1, MSG_1), 2.9)
    .add(typer(msg2, MSG_2), 4.1);
  blocks.forEach((b, i) => tl.set(b, { opacity: 1 }, 3.2 + i * 0.28 + (i % 3) * 0.06));

  // Bozulma: sahne yana sıçrar, renkler kayar
  [7.3, 7.42, 7.5, 7.9, 8.0].forEach((t, i) =>
    tl.set(stage, { x: i % 2 ? -9 : 12, filter: i % 2 ? 'hue-rotate(70deg)' : 'saturate(2.4)' }, t).set(stage, { x: 0, filter: 'none' }, t + 0.06),
  );

  // CRT kapanışı: görüntü yatay bir çizgiye çöker, çizgi söner
  tl.to(stage, { scaleY: 0.012, scaleX: 1.04, duration: 0.18, ease: 'power3.in' }, 8.6)
    .set(stage, { opacity: 0 }, 8.78)
    .set(off, { opacity: 1 }, 8.78)
    .set(noise, { opacity: 0 }, 8.78)
    .to(off, { scaleX: 0, duration: 0.22, ease: 'power2.in' }, 8.8)
    .set(off, { opacity: 0 }, 9.02)
    .set({}, {}, 9.9);

  out.push(tl);
  return out;
}
