import gsap from 'gsap';

// Hero fotoğrafındaki iki yan ekranın canvas çizimleri:
//  • sağdaki dikey monitör: akan kod satırları, monitörün perspektifine göre eğilmiş
//  • sol alttaki küçük CRT TV: kanallar arasında gezinir (radar, osiloskop, dünya + saldırı yayları)
// Her biri duraklatılmış bir GSAP tween'i döner; HeroScene görünür olduklarında oynatır.

// Basit deterministik rastgele
const rnd = (i) => {
  const x = Math.sin(i * 91.345 + 7.13) * 47453.5453;
  return x - Math.floor(x);
};

// ─────────────────────────── Sağ dikey monitör ───────────────────────────
// Ekran camının köşeleri (SVG koordinatı). Sol ve sağ kenar dikey; sağ taraf kameraya daha yakın (daha uzun).
export const TALL_QUAD = { x0: 1331, x1: 1562, tl: 203, bl: 660, tr: 172, br: 677 };
export const TALL_BOX = {
  x: TALL_QUAD.x0,
  y: TALL_QUAD.tr,
  width: TALL_QUAD.x1 - TALL_QUAD.x0,
  height: TALL_QUAD.br - TALL_QUAD.tr,
};
const TALL_RES = 2; // canvas çözünürlüğü (SVG biriminin katı)

// Ekranda akan kod: okunur büyüklükte, sade renkli sözdizimi (anahtar kelime, metin, sayı/fonksiyon, yorum).
const CODE = `# purple_loop.py: red saldırır, blue yakalar
import socket, time
from lab import red, blue, log

TARGET = "10.0.13.37"
PORTS = [22, 80, 443, 445, 8080]

def scan(host, ports):
    open_ports = []
    for port in ports:
        s = socket.socket()
        s.settimeout(0.3)
        if s.connect_ex((host, port)) == 0:
            open_ports.append(port)
        s.close()
    return open_ports

def detect(event):
    # şüpheli: kısa sürede çok bağlantı
    if event.count > 50 and event.window < 10:
        return blue.alert("T1046", event.src)
    elif event.user == "root" and not event.mfa:
        return blue.alert("T1078", event.src)
    return None

while True:
    found = scan(TARGET, PORTS)
    log.info(f"open: {found}")
    for port in found:
        attack = red.try_exploit(TARGET, port)
        alert = detect(attack.event)
        if alert is None:
            log.warn(f"tespit yok -> kural yaz")
            blue.add_rule(attack.signature)
        else:
            log.ok(f"yakalandı: {alert.id}")
    time.sleep(5)

class Beacon:
    def __init__(self, url, jitter=0.2):
        self.url = url
        self.jitter = jitter

    def is_suspicious(self, hits):
        gaps = [b - a for a, b in zip(hits, hits[1:])]
        return max(gaps) - min(gaps) < self.jitter
`.split('\n');

const KW = new Set('def return if elif else for while in import from as and or not is None True False class try except with lambda pass break continue self'.split(' '));
const C = {
  text: '#c9d7ee',
  kw: '#c49bff',
  str: '#a8d8a0',
  num: '#7fd3ff',
  fn: '#7fd3ff',
  com: '#6d7fa0',
  gut: 'rgba(120,150,200,0.45)',
};
const TOKEN = /(#.*$)|(f?"[^"]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(\s*\()?|(\s+)|(.)/g;

function tokens(line) {
  const out = [];
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m[1]) out.push([m[1], C.com]);
    else if (m[2]) out.push([m[2], C.str]);
    else if (m[3]) out.push([m[3], C.num]);
    else if (m[4]) {
      const color = KW.has(m[4]) ? C.kw : m[5] ? C.fn : C.text;
      out.push([m[4], color]);
      if (m[5]) out.push([m[5], C.text]);
    } else out.push([m[0], C.text]);
  }
  return out;
}

const FONT_PX = 18;
const LINE_H = 25;
const ROWS = CODE.length * 2;
const FLAT_W = 520;
const FLAT_H = 1180;
const GUTTER = 58;

// Kod "kaseti": bir kez çizilir, ekranda döngüyle akar.
function makeTape() {
  const c = document.createElement('canvas');
  c.width = FLAT_W;
  c.height = ROWS * LINE_H;
  const g = c.getContext('2d');
  g.fillStyle = '#060c18';
  g.fillRect(0, 0, c.width, c.height);
  g.font = `600 ${FONT_PX}px ui-monospace, Consolas, monospace`;
  g.textBaseline = 'middle';
  const cw = g.measureText('M').width;
  for (let r = 0; r < ROWS; r++) {
    const y = r * LINE_H + LINE_H / 2;
    g.shadowBlur = 0;
    g.fillStyle = C.gut;
    g.fillText(String((r % CODE.length) + 1).padStart(3, ' '), 6, y);
    let x = GUTTER;
    g.shadowBlur = 5;
    for (const [txt, color] of tokens(CODE[r % CODE.length])) {
      g.fillStyle = color;
      g.shadowColor = color;
      g.fillText(txt, x, y);
      x += cw * txt.length;
    }
  }
  return c;
}

export function tallLife(canvas) {
  const W = (canvas.width = TALL_BOX.width * TALL_RES);
  const H = (canvas.height = TALL_BOX.height * TALL_RES);
  const g = canvas.getContext('2d');
  const tape = makeTape();
  const flat = document.createElement('canvas');
  flat.width = FLAT_W;
  flat.height = FLAT_H;
  const fg = flat.getContext('2d');

  // Perspektif eşlemesi: düz görüntünün u (0–1) sütunu ekranda t konumuna düşer.
  // Yakın taraf (sağ) daha uzun görünür → t = u·hR / (u·hR + (1−u)·hL).
  const q = TALL_QUAD;
  const y = (v) => (v - q.tr) * TALL_RES;
  const topL = y(q.tl);
  const botL = y(q.bl);
  const topR = y(q.tr);
  const botR = y(q.br);
  const hL = botL - topL;
  const hR = botR - topR;
  const uOf = (t) => (t * hL) / (hR * (1 - t) + t * hL);
  const STEP = 2;
  const cols = [];
  for (let x = 0; x < W; x += STEP) {
    const t0 = x / W;
    const t1 = Math.min((x + STEP) / W, 1);
    const tm = (t0 + t1) / 2;
    const top = topL + (topR - topL) * tm;
    const bot = botL + (botR - botL) * tm;
    cols.push({ x, u0: uOf(t0), u1: uOf(t1), top, h: bot - top });
  }

  const tapeH = tape.height;
  let last = -1;
  const draw = (time) => {
    // Satırlar aşağı akar; arada bir kısa hızlanma.
    const off = (time * 38 + Math.max(0, Math.sin(time * 0.7)) * 50) % tapeH;
    if (Math.abs(off - last) < 0.3) return;
    last = off;
    fg.drawImage(tape, 0, off - tapeH);
    fg.drawImage(tape, 0, off);
    if (off + tapeH < FLAT_H) fg.drawImage(tape, 0, off + tapeH);
    // yanıp sönen imleç
    if (Math.floor(time * 2) % 2 === 0) {
      fg.fillStyle = '#d8e8ff';
      fg.fillRect(GUTTER, 6, 10, 18);
    }

    g.clearRect(0, 0, W, H);
    for (const c of cols) {
      g.drawImage(flat, c.u0 * FLAT_W, 0, Math.max((c.u1 - c.u0) * FLAT_W, 0.5), FLAT_H, c.x, c.top, STEP + 0.6, c.h);
    }
    // Camın hafif parlaması ve kenar kararması
    const gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.35)');
    gr.addColorStop(0.25, 'rgba(0,0,0,0)');
    gr.addColorStop(0.85, 'rgba(255,255,255,0.03)');
    gr.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
  };
  draw(0);

  const clock = { t: 0 };
  return gsap.to(clock, {
    t: 1000,
    duration: 1000,
    ease: 'none',
    repeat: -1,
    paused: true,
    onUpdate: () => draw(clock.t),
  });
}

// ─────────────────────────── Sol alt küçük TV ───────────────────────────
export const TV_RES = 2;

const CHANNELS = [
  { name: 'CH 02', label: 'RADAR', draw: radar, len: 5 },
  { name: 'CH 03', label: 'SIGNAL', draw: scope, len: 4.5 },
  { name: 'CH 04', label: 'LIVE', draw: globe, len: 5.5 },
];
const STATIC = 0.45; // kanal değişirken karınca süresi

function radar(g, w, h, t) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  g.fillStyle = '#03100c';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(110,255,190,0.35)';
  g.lineWidth = 1.2;
  for (let k = 1; k <= 3; k++) {
    g.beginPath();
    g.arc(cx, cy, (R * k) / 3, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(cx - R, cy);
  g.lineTo(cx + R, cy);
  g.moveTo(cx, cy - R);
  g.lineTo(cx, cy + R);
  g.stroke();
  const a = t * 2.2;
  // tarama yelpazesi
  for (let k = 0; k < 24; k++) {
    g.fillStyle = `rgba(110,255,190,${0.22 * (1 - k / 24)})`;
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, R, a - (k + 1) * 0.03, a - k * 0.03);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = 'rgba(170,255,215,0.9)';
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  g.stroke();
  // hedefler: tarama geçince parlar, sonra söner
  for (let i = 0; i < 7; i++) {
    const ba = rnd(i + 30) * Math.PI * 2;
    const br = R * (0.2 + rnd(i + 60) * 0.75);
    const since = (((a - ba) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const glow = Math.max(0, 1 - since / 3);
    const hostile = i % 3 === 0;
    g.fillStyle = hostile ? `rgba(255,80,120,${glow})` : `rgba(170,255,215,${glow})`;
    g.beginPath();
    g.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 2.6 + glow * 1.5, 0, Math.PI * 2);
    g.fill();
  }
}

function scope(g, w, h, t) {
  g.fillStyle = '#020a10';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,200,255,0.13)';
  g.lineWidth = 1;
  for (let x = 0; x <= w; x += w / 8) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let y = 0; y <= h; y += h / 6) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  const wave = (color, amp, f, ph, yc, noise) => {
    g.strokeStyle = color;
    g.lineWidth = 2;
    g.shadowColor = color;
    g.shadowBlur = 6;
    g.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const u = x / w;
      const v =
        Math.sin(u * f + t * 5 + ph) * amp +
        Math.sin(u * f * 3.1 - t * 9) * amp * 0.25 +
        (noise ? (rnd(Math.floor(x + t * 60)) - 0.5) * noise : 0);
      if (x) g.lineTo(x, yc + v);
      else g.moveTo(x, yc + v);
    }
    g.stroke();
    g.shadowBlur = 0;
  };
  wave('#7fe0ff', h * 0.13, 12, 0, h * 0.36, 0);
  // ikinci kanal: ara ara "atak" sıçramaları
  const spike = Math.sin(t * 1.7) > 0.75 ? h * 0.16 : h * 0.015;
  wave('#c39bff', h * 0.06, 26, 1.3, h * 0.7, spike);
}

function globe(g, w, h, t) {
  g.fillStyle = '#04070f';
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2 + 4;
  const R = Math.min(w, h) * 0.38;
  const rot = t * 0.6;
  const tilt = 0.35;
  const proj = (lat, lon) => {
    const x = Math.cos(lat) * Math.sin(lon + rot);
    const y0 = Math.sin(lat);
    const z0 = Math.cos(lat) * Math.cos(lon + rot);
    const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    return { x: cx + x * R, y: cy - y * R, z };
  };
  g.strokeStyle = 'rgba(120,190,255,0.5)';
  g.lineWidth = 1;
  g.beginPath();
  g.arc(cx, cy, R, 0, Math.PI * 2);
  g.stroke();
  // enlem/boylam çizgileri (sadece ön yüz)
  const line = (pts) => {
    let pen = false;
    g.beginPath();
    for (const p of pts) {
      if (p.z < 0) {
        pen = false;
        continue;
      }
      if (pen) g.lineTo(p.x, p.y);
      else g.moveTo(p.x, p.y);
      pen = true;
    }
    g.stroke();
  };
  g.strokeStyle = 'rgba(120,190,255,0.28)';
  for (let k = -2; k <= 2; k++) {
    const lat = (k * Math.PI) / 6;
    line(Array.from({ length: 49 }, (_, i) => proj(lat, (i / 48) * Math.PI * 2)));
  }
  for (let k = 0; k < 8; k++) {
    const lon = (k * Math.PI) / 4;
    line(Array.from({ length: 33 }, (_, i) => proj(-Math.PI / 2 + (i / 32) * Math.PI, lon)));
  }
  // saldırı yayları: noktadan noktaya akan mor/kırmızı yaylar
  const sites = Array.from({ length: 8 }, (_, i) => [(rnd(i + 11) - 0.5) * 2.2, rnd(i + 21) * Math.PI * 2]);
  for (let a = 0; a < 5; a++) {
    const s = sites[a];
    const e = sites[(a * 3 + 2) % sites.length];
    const phase = (t * 0.7 + a * 0.37) % 1.4;
    if (phase > 1) continue;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = (i / 24) * phase;
      const lat = s[0] + (e[0] - s[0]) * u;
      const lon = s[1] + (e[1] - s[1]) * u;
      const p = proj(lat, lon);
      const lift = 1 + Math.sin(u * Math.PI) * 0.25;
      pts.push({ x: cx + (p.x - cx) * lift, y: cy + (p.y - cy) * lift, z: p.z });
    }
    g.strokeStyle = a % 2 ? 'rgba(255,90,130,0.9)' : 'rgba(195,155,255,0.95)';
    g.lineWidth = 1.6;
    line(pts);
    const head = pts[pts.length - 1];
    if (head.z >= 0) {
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(head.x, head.y, 2, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function makeNoise(w, h, n) {
  const frames = [];
  for (let f = 0; f < n; f++) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v * 0.78;
      img.data[i + 1] = v * 0.88;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    frames.push(c);
  }
  return frames;
}

export function tvLife(canvas, w, h) {
  const W = (canvas.width = w * TV_RES);
  const H = (canvas.height = h * TV_RES);
  const g = canvas.getContext('2d');
  const noise = makeNoise(Math.round(w * 0.9), Math.round(h * 0.9), 5);
  const cycle = CHANNELS.reduce((s, c) => s + c.len + STATIC, 0);

  const draw = (time) => {
    let t = time % cycle;
    let ch = 0;
    while (t > CHANNELS[ch].len + STATIC) {
      t -= CHANNELS[ch].len + STATIC;
      ch++;
    }
    const c = CHANNELS[ch];
    if (t < STATIC) {
      // kanal değişimi: karınca + yuvarlanan görüntü
      g.imageSmoothingEnabled = false;
      g.drawImage(noise[Math.floor(time * 24) % noise.length], 0, 0, W, H);
      g.imageSmoothingEnabled = true;
    } else {
      c.draw(g, W, H, time);
      // ara ara yatay kayma
      if (Math.sin(time * 3.3) > 0.97) {
        const y = (time * 120) % H;
        g.drawImage(canvas, 0, y, W, 10, 8, y, W, 10);
      }
    }
    // ekran üstü yazılar (OSD)
    g.font = `700 ${Math.round(H * 0.075)}px ui-monospace, Consolas, monospace`;
    g.textBaseline = 'top';
    g.fillStyle = 'rgba(140,255,200,0.95)';
    g.shadowColor = 'rgba(0,0,0,0.9)';
    g.shadowBlur = 3;
    g.textAlign = 'right';
    g.fillText(c.name, W - 14, 12);
    g.textAlign = 'left';
    if (t >= STATIC) {
      g.fillStyle = Math.floor(time * 2) % 2 ? 'rgba(255,80,120,0.95)' : 'rgba(255,80,120,0.35)';
      g.fillText(`● ${c.label}`, 14, H - 12 - H * 0.075);
    }
    g.shadowBlur = 0;
  };
  draw(0);

  const clock = { t: 0 };
  return gsap.to(clock, {
    t: 1000,
    duration: 1000,
    ease: 'none',
    repeat: -1,
    paused: true,
    onUpdate: () => draw(clock.t),
  });
}
