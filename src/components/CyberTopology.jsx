import { useEffect, useRef, useState } from 'react';

const NODES = [
  { id: 'attacker', x: 0.12, y: 0.5, label: 'Attacker', sub: '185.220.101.4', color: '#ff6b8b', project: 'Stealth-TCP-SYN-Scanner' },
  { id: 'waf', x: 0.34, y: 0.3, label: 'WAF / Edge', sub: 'Regex Filter', color: '#fbbf24', project: 'google-dork-auditor' },
  { id: 'webapp', x: 0.56, y: 0.25, label: 'Web App', sub: '80 / 443 TCP', color: '#7fd3ff', project: 'SSRF-Ghost' },
  { id: 'meta', x: 0.82, y: 0.24, label: 'Metadata', sub: '169.254.169.254', color: '#c4a1ff', project: 'SSRF-Ghost' },
  { id: 'ad', x: 0.45, y: 0.74, label: 'Windows AD', sub: 'Security.evtx', color: '#7fd3ff', project: 'Log-Analayzer' },
  { id: 'siem', x: 0.7, y: 0.71, label: 'SIEM / ML', sub: 'Isolation Forest', color: '#6effbe', project: 'Log-Analayzer' },
  { id: 'soc', x: 0.89, y: 0.52, label: 'SOC Node', sub: 'onur@kali', color: '#c4a1ff', project: 'BHP-Net-Tool' },
];

const EDGES = [
  ['attacker', 'waf', 0.08],
  ['waf', 'webapp', -0.05],
  ['webapp', 'meta', -0.04],
  ['attacker', 'ad', 0.1],
  ['ad', 'siem', 0.04],
  ['webapp', 'siem', 0.06],
  ['meta', 'siem', 0.05],
  ['siem', 'soc', -0.04],
  ['waf', 'siem', 0.12],
];

const SCENARIOS = [
  {
    id: 'ssrf',
    label: 'SSRF-Ghost Bypass',
    project: 'SSRF-Ghost',
    demoCmd: 'ssrf-ghost --demo',
    status: '[RED] Octal IP (0251.0376.0251.0376) WAF’ı aştı → [PURPLE] Egress allowlist kapatıldı.',
    steps: [
      { at: 0, from: 'attacker', to: 'waf', color: '#ff4d7d', curve: -0.14, label: '0251.0376.*' },
      { at: 0.45, from: 'waf', to: 'webapp', color: '#ff4d7d', curve: -0.12 },
      { at: 0.9, from: 'webapp', to: 'meta', color: '#ff4d7d', curve: -0.05, hit: true },
      { at: 1.5, from: 'meta', to: 'siem', color: '#6effbe', curve: 0.05, label: 'ALERT' },
      { at: 2.0, from: 'siem', to: 'waf', color: '#c4a1ff', curve: 0.12, shield: true, label: 'RULE++' },
    ],
  },
  {
    id: 'syn',
    label: 'Stealth SYN Scan',
    project: 'Stealth-TCP-SYN-Scanner',
    demoCmd: 'syn-scan 10.0.13.37',
    status: '[RED] Half-open SYN taraması → [BLUE] SIEM 5sn >20 SYN korelasyonu alarm üretti.',
    steps: [
      { at: 0, from: 'attacker', to: 'waf', color: '#ff6b8b', curve: 0.05, label: 'SYN 22' },
      { at: 0.18, from: 'attacker', to: 'webapp', color: '#ff6b8b', curve: -0.08, label: 'SYN 443' },
      { at: 0.36, from: 'attacker', to: 'ad', color: '#ff6b8b', curve: 0.1, label: 'SYN 445', hit: true },
      { at: 1.0, from: 'waf', to: 'siem', color: '#5ee6ff', curve: 0.12 },
      { at: 1.35, from: 'siem', to: 'soc', color: '#6effbe', curve: -0.04, shield: true, label: 'T1046' },
    ],
  },
  {
    id: 'ml',
    label: 'Isolation Forest ML',
    project: 'Log-Analayzer',
    demoCmd: 'log-analyzer --sample',
    status: '[BLUE] EventID 4625/4672 skor=-0.78 tespit edildi → SOC düğümünde olay izole edildi.',
    steps: [
      { at: 0, from: 'attacker', to: 'ad', color: '#ff4d7d', curve: 0.12, label: '4625/4672', hit: true },
      { at: 0.7, from: 'ad', to: 'siem', color: '#8ab4ff', curve: 0.04, label: 'EVTX' },
      { at: 1.3, from: 'siem', to: 'siem', color: '#6effbe', curve: 0, shield: true, label: 'ML -0.78' },
      { at: 1.75, from: 'siem', to: 'soc', color: '#c4a1ff', curve: -0.04, label: 'ISOLATED' },
    ],
  },
  {
    id: 'dork',
    label: 'OSINT Dork Sweep',
    project: 'google-dork-auditor',
    demoCmd: 'dork-audit',
    status: '[PURPLE] filetype:env yüzeyi tarandı → açık indeks SOC görünürlüğüne çekilip kapatıldı.',
    steps: [
      { at: 0, from: 'attacker', to: 'waf', color: '#c4a1ff', curve: 0.08, label: 'dork:env' },
      { at: 0.5, from: 'waf', to: 'webapp', color: '#fbbf24', curve: -0.05, hit: true },
      { at: 1.15, from: 'webapp', to: 'siem', color: '#6effbe', curve: 0.06, label: 'AUDIT' },
      { at: 1.7, from: 'siem', to: 'soc', color: '#c4a1ff', curve: -0.04, shield: true, label: 'SEALED' },
    ],
  },
];

function quadPoint(p0, p1, curve, t) {
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const cx = mx - dy * curve;
  const cy = my + dx * curve;
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * cx + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * cy + t * t * p1.y,
    cx,
    cy,
  };
}

// Çalışma Alanı 3: İnteraktif Canlı Ağ Topolojisi & Purple Team Saldırı Haritası.
export default function CyberTopology({ active, theme, onOpenProject, onRunDemo, onActionTone }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [selectedNode, setSelectedNode] = useState(NODES[3]);
  const selectedNodeRef = useRef(selectedNode);
  selectedNodeRef.current = selectedNode;
  const onActionToneRef = useRef(onActionTone);
  onActionToneRef.current = onActionTone;
  const hoveredRef = useRef(null);
  const animPacketsRef = useRef([]);
  const ringsRef = useRef([]);
  const sparksRef = useRef([]);
  const timersRef = useRef([]);

  const triggerScenario = (sc) => {
    setScenario(sc);
    onActionToneRef.current?.();
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    sc.steps.forEach((step) => {
      const id = setTimeout(() => {
        if (step.from === step.to) {
          ringsRef.current.push({ nodeId: step.to, color: step.color, r: 8, alpha: 0.95 });
          return;
        }
        animPacketsRef.current.push({
          from: step.from,
          to: step.to,
          color: step.color,
          curve: step.curve,
          label: step.label,
          hit: step.hit,
          shield: step.shield,
          t: 0,
          speed: 1.55,
        });
      }, step.at * 1000);
      timersRef.current.push(id);
    });
  };

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (active) {
      triggerScenario(SCENARIOS[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active) {
      animPacketsRef.current.length = 0;
      ringsRef.current.length = 0;
      sparksRef.current.length = 0;
      return undefined;
    }
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const g = canvas.getContext('2d');
    if (!g) return undefined;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const posOf = (node) => ({ x: node.x * w, y: node.y * h });
    const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

    // Sürekli akan arka plan trafik paketleri
    const ambient = EDGES.map((e, i) => ({
      edge: e,
      t: (i * 0.23) % 1,
      speed: 0.24 + (i % 3) * 0.08,
    }));

    const hitNode = (mx, my) => {
      for (const n of NODES) {
        const p = posOf(n);
        if (Math.hypot(mx - p.x, my - p.y) <= 28) return n;
      }
      return null;
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const found = hitNode(e.clientX - rect.left, e.clientY - rect.top);
      hoveredRef.current = found ? found.id : null;
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const found = hitNode(e.clientX - rect.left, e.clientY - rect.top);
      if (!found) return;
      setSelectedNode(found);
      onActionToneRef.current?.();
      ringsRef.current.push({ nodeId: found.id, color: found.color, r: 10, alpha: 0.9 });
    };

    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('click', onClick);

    let lastTs = 0;
    const loop = (ts) => {
      raf = 0;
      if (document.hidden || !active || !w || !h) return;
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;
      const t = ts * 0.001;
      const rgb = themeRef.current?.accentRgb || '167, 139, 250';

      g.clearRect(0, 0, w, h);
      g.fillStyle = '#070910';
      g.fillRect(0, 0, w, h);

      // Holografik ızgara
      g.strokeStyle = `rgba(${rgb}, 0.07)`;
      g.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 36) {
        g.beginPath();
        g.moveTo(gx, 0);
        g.lineTo(gx, h);
        g.stroke();
      }
      for (let gy = 0; gy < h; gy += 36) {
        g.beginPath();
        g.moveTo(0, gy);
        g.lineTo(w, gy);
        g.stroke();
      }

      // Fiber bağlantılar
      for (const [aId, bId, curve] of EDGES) {
        const p0 = posOf(byId[aId]);
        const p1 = posOf(byId[bId]);
        const mid = quadPoint(p0, p1, curve, 0.5);
        g.strokeStyle = 'rgba(130, 170, 255, 0.18)';
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(p0.x, p0.y);
        g.quadraticCurveTo(mid.cx, mid.cy, p1.x, p1.y);
        g.stroke();
      }

      // Arka plan paketleri
      for (const ap of ambient) {
        ap.t = (ap.t + dt * ap.speed) % 1;
        const p0 = posOf(byId[ap.edge[0]]);
        const p1 = posOf(byId[ap.edge[1]]);
        const pt = quadPoint(p0, p1, ap.edge[2], ap.t);
        g.fillStyle = `rgba(${rgb}, 0.55)`;
        g.beginPath();
        g.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
        g.fill();
      }

      // Aktif senaryo paketleri
      for (let i = animPacketsRef.current.length - 1; i >= 0; i--) {
        const pk = animPacketsRef.current[i];
        pk.t += dt * pk.speed;
        const p0 = posOf(byId[pk.from]);
        const p1 = posOf(byId[pk.to]);
        const cur = Math.min(pk.t, 1);
        const tailT = Math.max(0, cur - 0.14);

        g.strokeStyle = pk.color;
        g.lineWidth = 2.4;
        g.shadowColor = pk.color;
        g.shadowBlur = 10;
        g.beginPath();
        for (let s = 0; s <= 10; s++) {
          const st = tailT + ((cur - tailT) * s) / 10;
          const q = quadPoint(p0, p1, pk.curve, st);
          if (s === 0) g.moveTo(q.x, q.y);
          else g.lineTo(q.x, q.y);
        }
        g.stroke();

        const head = quadPoint(p0, p1, pk.curve, cur);
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(head.x, head.y, 3.6, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;

        if (pk.label) {
          g.font = '700 9.5px ui-monospace, Consolas, monospace';
          g.fillStyle = pk.color;
          g.textAlign = 'center';
          g.fillText(pk.label, head.x, head.y - 10);
        }

        if (pk.t >= 1) {
          if (pk.hit || pk.shield) {
            ringsRef.current.push({ nodeId: pk.to, color: pk.color, r: 8, alpha: 0.95 });
            for (let k = 0; k < 10; k++) {
              const ang = (k / 10) * Math.PI * 2 + Math.random() * 0.4;
              const spd = 28 + Math.random() * 44;
              sparksRef.current.push({
                x: p1.x,
                y: p1.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: pk.color,
                alpha: 1,
              });
            }
          }
          animPacketsRef.current.splice(i, 1);
        }
      }

      // Şok halkaları
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const rg = ringsRef.current[i];
        const center = posOf(byId[rg.nodeId]);
        rg.r += dt * 78;
        rg.alpha -= dt * 1.15;
        if (rg.alpha <= 0.02) {
          ringsRef.current.splice(i, 1);
          continue;
        }
        g.strokeStyle = rg.color;
        g.globalAlpha = Math.max(0, rg.alpha);
        g.lineWidth = 2;
        g.beginPath();
        g.arc(center.x, center.y, rg.r, 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = 1;
      }

      // Parçacık kıvılcımları
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.alpha -= dt * 1.7;
        if (sp.alpha <= 0.02) {
          sparksRef.current.splice(i, 1);
          continue;
        }
        g.fillStyle = sp.color;
        g.globalAlpha = sp.alpha;
        g.beginPath();
        g.arc(sp.x, sp.y, 1.8, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }

      // Düğümler
      for (const n of NODES) {
        const p = posOf(n);
        const hovered = hoveredRef.current === n.id;
        const selected = selectedNodeRef.current?.id === n.id;
        const rad = hovered || selected ? 19 : 15;
        const pulse = 1 + 0.14 * Math.sin(t * 2.8 + n.x * 10);

        const glow = g.createRadialGradient(p.x, p.y, 4, p.x, p.y, rad * 2.2);
        glow.addColorStop(0, `${n.color}44`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = glow;
        g.beginPath();
        g.arc(p.x, p.y, rad * 2.2, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = '#0c101b';
        g.strokeStyle = n.color;
        g.lineWidth = selected ? 2.4 : 1.6;
        g.beginPath();
        g.arc(p.x, p.y, rad, 0, Math.PI * 2);
        g.fill();
        g.stroke();

        g.strokeStyle = `${n.color}55`;
        g.lineWidth = 1;
        g.beginPath();
        g.arc(p.x, p.y, (rad + 5) * pulse, 0, Math.PI * 2);
        g.stroke();

        g.fillStyle = n.color;
        g.beginPath();
        g.arc(p.x, p.y, 4, 0, Math.PI * 2);
        g.fill();

        g.textAlign = 'center';
        g.font = '700 10.5px ui-monospace, Consolas, monospace';
        g.fillStyle = '#ffffff';
        g.fillText(n.label, p.x, p.y + rad + 15);
        g.font = '500 9px ui-monospace, Consolas, monospace';
        g.fillStyle = 'rgba(255,255,255,0.48)';
        g.fillText(n.sub, p.x, p.y + rad + 27);
      }

      raf = requestAnimationFrame(loop);
    };

    const onVis = () => {
      if (!document.hidden && active && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#070910]">
      {/* Senaryo çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0d1019] px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
          {SCENARIOS.map((sc) => {
            const on = scenario.id === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => triggerScenario(sc)}
                className={`rounded border px-2.5 py-1 transition ${
                  on
                    ? 'border-[var(--k-accent,#a78bfa)]/60 bg-[var(--k-accent,#a78bfa)]/20 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white'
                }`}
              >
                ⚡ {sc.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px]">
          <button
            type="button"
            onClick={() => onOpenProject?.(scenario.project)}
            className="rounded border border-white/15 bg-white/[0.04] px-2 py-1 text-white/80 hover:border-white/30 hover:text-white"
          >
            Vaka: {scenario.project} ↗
          </button>
          <button
            type="button"
            onClick={() => onRunDemo?.(scenario.demoCmd)}
            className="rounded border border-[#6effbe]/35 bg-[#6effbe]/10 px-2 py-1 text-[#6effbe] hover:bg-[#6effbe]/20"
          >
            Demo ▶
          </button>
        </div>
      </div>

      {/* Canlı status */}
      <div className="border-b border-white/10 bg-[#0a0d15] px-3 py-1.5 font-mono text-[10.5px] text-white/75">
        {scenario.status}
      </div>

      {/* Topoloji Canvas */}
      <div ref={wrapRef} className="relative min-h-[240px] flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="block h-full w-full" aria-label="İnteraktif ağ topolojisi ve saldırı haritası" />
      </div>

      {/* Seçili düğüm alt bilgi kartı */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0d1019] px-3.5 py-2 font-mono text-[11px]">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedNode.color, boxShadow: `0 0 8px ${selectedNode.color}` }} />
          <span className="font-bold text-white">{selectedNode.label}</span>
          <span className="text-white/45">({selectedNode.sub})</span>
          <span className="hidden text-white/55 sm:inline">— İlgili proje: {selectedNode.project}</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenProject?.(selectedNode.project)}
          className="text-[var(--k-accent,#c4a1ff)] underline decoration-white/25 underline-offset-4 hover:text-white"
        >
          {selectedNode.project} İncele ↗
        </button>
      </div>
    </div>
  );
}
