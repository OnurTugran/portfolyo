// Saf Web Audio API atmosferik ses motoru (varsayılan kapalı, sıfır harici ses dosyası).
let ctx = null;
let enabled = false;
let phase = 'off';

let masterGain = null;
let linesGain = null;
let roomGain = null;
let noiseBuf = null;
const listeners = new Set();

function ensureAudio() {
  if (ctx || typeof window === 'undefined') return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.0001;
  masterGain.connect(ctx.destination);

  // Ortak gürültü tamponu (1.5 sn, PC fanı / statik cızırtı / mekanik tuş için)
  const len = Math.floor(ctx.sampleRate * 1.5);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  // Faz 1: çizim aşaması — sıcak düşük frekanslı analog synth uğultusu
  linesGain = ctx.createGain();
  linesGain.gain.value = 0.0001;
  const linesLp = ctx.createBiquadFilter();
  linesLp.type = 'lowpass';
  linesLp.frequency.value = 220;

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 68;
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = 136;
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.value = 0.25;

  osc1.connect(linesLp);
  osc2.connect(osc2Gain);
  osc2Gain.connect(linesLp);
  linesLp.connect(linesGain);
  linesGain.connect(masterGain);
  osc1.start();
  osc2.start();

  // Faz 2+: oda aşaması — yumuşak filtrelenmiş PC fan / CRT uğultusu
  roomGain = ctx.createGain();
  roomGain.gain.value = 0.0001;
  const roomLp = ctx.createBiquadFilter();
  roomLp.type = 'lowpass';
  roomLp.frequency.value = 380;

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  noiseSrc.loop = true;
  noiseSrc.connect(roomLp);
  roomLp.connect(roomGain);
  roomGain.connect(masterGain);
  noiseSrc.start();

  return ctx;
}

function applyPhase() {
  if (!ctx || !masterGain || !linesGain || !roomGain) return;
  const now = ctx.currentTime;
  const ambientActive = enabled && phase !== 'off';
  // Master kazancı ses açıkken hep hazır kalsın → masaüstündeki tek seferlik efektler de çalar.
  masterGain.gain.setTargetAtTime(enabled ? 1 : 0.0001, now, 0.08);

  const lTarget = ambientActive && phase === 'lines' ? 0.028 : 0.0001;
  const rTarget = !ambientActive ? 0.0001 : phase === 'room' ? 0.022 : phase === 'login' ? 0.012 : 0.0001;
  linesGain.gain.setTargetAtTime(lTarget, now, 0.16);
  roomGain.gain.setTargetAtTime(rTarget, now, 0.16);
}

export function isSfxEnabled() {
  return enabled;
}

export function subscribeSfx(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toggleSfx() {
  enabled = !enabled;
  if (enabled) {
    const ac = ensureAudio();
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
  }
  applyPhase();
  listeners.forEach((fn) => fn(enabled));
  return enabled;
}

export function setSfxPhase(nextPhase) {
  if (phase === nextPhase) return;
  phase = nextPhase;
  if (!enabled || !ctx) return;
  applyPhase();
}

export function playStaticTick() {
  if (!enabled || !ctx || !noiseBuf || !masterGain) return;
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 1.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.03, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

  src.connect(bp);
  bp.connect(g);
  g.connect(masterGain);
  src.start(now);
  src.stop(now + 0.08);
}

export function playAlertBlip() {
  if (!enabled || !ctx || !masterGain) return;
  const now = ctx.currentTime;
  [880, 660].forEach((freq, i) => {
    const t0 = now + i * 0.05;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.024, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.05);
  });
}

export function playKeyClick() {
  if (!enabled || !ctx || !noiseBuf || !masterGain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1150, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.032, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.022);
}

export function playLoginSuccess() {
  if (!enabled || !ctx || !masterGain) return;
  const now = ctx.currentTime;
  [523.25, 783.99].forEach((freq, i) => {
    const t0 = now + i * 0.085;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.034, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.19);
  });
}

export function playUiChime() {
  if (!enabled || !ctx || !masterGain) return;
  const now = ctx.currentTime;
  [659.25, 987.77].forEach((freq, i) => {
    const t0 = now + i * 0.055;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.022, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.13);
  });
}
