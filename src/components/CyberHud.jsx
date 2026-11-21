import { useEffect, useRef, useState } from 'react';

const MITRE_COLUMNS = [
  {
    tactic: 'Reconnaissance',
    color: '#c4a1ff',
    items: [
      { id: 'T1593', name: 'Search Open Info', project: 'google-dork-auditor', role: 'Pasif OSINT & sızan .env yüzey taraması' },
      { id: 'T1046', name: 'Network Discovery', project: 'Stealth-TCP-SYN-Scanner', role: 'Raw socket half-open SYN keşfi & IDS test' },
    ],
  },
  {
    tactic: 'Initial Access',
    color: '#ff8a8a',
    items: [
      { id: 'T1190', name: 'Exploit Public App', project: 'SSRF-Ghost', role: 'Octal/IPv6 bypass + egress allowlist doğrulama' },
    ],
  },
  {
    tactic: 'Command & Control',
    color: '#ff8a8a',
    items: [
      { id: 'T1095', name: 'Non-App Layer Proto', project: 'BHP-Net-Tool', role: 'TCP soket oturumu & outbound port analizi' },
      { id: 'T1059', name: 'Command Shell', project: 'BHP-Net-Tool', role: 'Etkileşimli laboratuvar kabuğu & soket savunması' },
    ],
  },
  {
    tactic: 'Detection / Evade',
    color: '#8ab4ff',
    items: [
      { id: 'T1078', name: 'Valid Accounts', project: 'Log-Analayzer', role: 'EventID 4625/4672 sıra dışı yetki anomalisi' },
      { id: 'T1070', name: 'Indicator Removal', project: 'Log-Analayzer', role: 'Windows Security.evtx log korelasyonu' },
    ],
  },
  {
    tactic: 'Purple Ops / Tools',
    color: '#6effbe',
    items: [
      { id: 'ML-IF', name: 'Isolation Forest', project: 'Log-Analayzer', role: 'Gözetimsiz ML ile aykırı log skorlama (-0.78)' },
      { id: 'LOCAL', name: 'Offline Privacy', project: 'omniverse', role: 'Üçüncü parti buluta yüklemeden yerel dosya hattı' },
    ],
  },
];

// Çalışma Alanı 4: Holografik Cyber HUD (Neon Kadranlar + Spektrum) & MITRE ATT&CK Kapsam Matrisi.
export default function CyberHud({ active, theme, onOpenProject }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const [hoverTech, setHoverTech] = useState(MITRE_COLUMNS[1].items[0]);

  useEffect(() => {
    if (!active) return undefined;
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

    const gauges = [
      { label: 'RED SIM', base: 0.78, color: '#ff6b8b', unit: '%' },
      { label: 'BLUE DETECT', base: 0.94, color: '#5ee6ff', unit: '%' },
      { label: 'ML ANOMALY', base: 0.87, color: '#a78bfa', unit: '%' },
      { label: 'RULE COV', base: 0.96, color: '#6effbe', unit: '%' },
    ];

    const loop = (ts) => {
      raf = 0;
      if (document.hidden || !active || !w || !h) return;
      const t = ts * 0.001;
      const accent = themeRef.current?.accent || '#a78bfa';

      g.clearRect(0, 0, w, h);
      g.fillStyle = '#070911';
      g.fillRect(0, 0, w, h);

      // İnce zemin ızgarası
      g.strokeStyle = 'rgba(140, 175, 255, 0.055)';
      g.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 32) {
        g.beginPath();
        g.moveTo(gx, 0);
        g.lineTo(gx, h);
        g.stroke();
      }

      const wide = w >= 620;
      const gaugeAreaW = wide ? w * 0.65 : w;
      const spacing = gaugeAreaW / gauges.length;
      const R = Math.min(spacing * 0.34, h * 0.3);

      gauges.forEach((gd, i) => {
        const cx = spacing * (i + 0.5);
        const cy = h * 0.46;
        const val = Math.min(0.99, Math.max(0.4, gd.base + Math.sin(t * 1.4 + i * 1.7) * 0.04));

        // Dış kesikli dönen halka
        g.save();
        g.translate(cx, cy);
        g.rotate(t * (i % 2 ? -0.45 : 0.45));
        g.strokeStyle = 'rgba(255,255,255,0.14)';
        g.lineWidth = 1.2;
        g.setLineDash([5, 6]);
        g.beginPath();
        g.arc(0, 0, R + 7, 0, Math.PI * 2);
        g.stroke();
        g.restore();

        // Taban yay
        g.strokeStyle = 'rgba(255,255,255,0.08)';
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25);
        g.stroke();

        // Aktif neon değer yayı
        const endAng = Math.PI * 0.75 + Math.PI * 1.5 * val;
        g.strokeStyle = gd.color;
        g.shadowColor = gd.color;
        g.shadowBlur = 10;
        g.lineWidth = 5;
        g.beginPath();
        g.arc(cx, cy, R, Math.PI * 0.75, endAng);
        g.stroke();
        g.shadowBlur = 0;

        // Değer ve etiket
        g.textAlign = 'center';
        g.fillStyle = '#ffffff';
        g.font = `700 ${Math.max(11, Math.round(R * 0.38))}px ui-monospace, Consolas, monospace`;
        g.fillText(`${Math.round(val * 100)}${gd.unit}`, cx, cy + 4);

        g.fillStyle = 'rgba(255,255,255,0.6)';
        g.font = '600 9.5px ui-monospace, Consolas, monospace';
        g.fillText(gd.label, cx, cy + R + 22);
      });

      // Sağda Neon Spektrum Ekolayzer + hex telemetri
      if (wide) {
        const sx = gaugeAreaW + 12;
        const sw = w - sx - 16;
        g.strokeStyle = 'rgba(255,255,255,0.08)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(gaugeAreaW, 14);
        g.lineTo(gaugeAreaW, h - 14);
        g.stroke();

        g.textAlign = 'left';
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.font = '600 9.5px ui-monospace, Consolas, monospace';
        g.fillText('ENTROPY & SIGNAL SPECTRUM', sx, 22);

        const bars = 18;
        const bw = (sw - (bars - 1) * 3) / bars;
        const baseY = h - 34;
        const maxH = h - 72;
        for (let b = 0; b < bars; b++) {
          const amp = 0.25 + 0.7 * Math.abs(Math.sin(t * 3.1 + b * 0.55) * Math.cos(t * 1.3 - b * 0.3));
          const bh = maxH * amp;
          const bx = sx + b * (bw + 3);
          const grad = g.createLinearGradient(0, baseY - bh, 0, baseY);
          grad.addColorStop(0, '#6effbe');
          grad.addColorStop(0.55, accent);
          grad.addColorStop(1, 'rgba(111,156,255,0.25)');
          g.fillStyle = grad;
          g.fillRect(bx, baseY - bh, bw, bh);
        }

        const hexSeed = Math.floor(t * 8).toString(16).toUpperCase().padStart(4, '0');
        g.fillStyle = 'rgba(110,255,190,0.75)';
        g.font = '500 9.5px ui-monospace, Consolas, monospace';
        g.fillText(`0x${hexSeed} · STREAM VERIFIED · CRT-01 CLEAN`, sx, h - 14);
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
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#070911]">
      <div ref={wrapRef} className="h-[168px] shrink-0 border-b border-white/10 sm:h-[188px]">
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      </div>

      {/* MITRE ATT&CK Kapsam Matrisi */}
      <div className="k-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
            MITRE ATT&amp;CK Kapsam Matrisi (tıkla → ilgili proje)
          </p>
          <span className="font-mono text-[10.5px] text-[var(--k-accent,#c4a1ff)]">
            {hoverTech.id}: {hoverTech.role}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {MITRE_COLUMNS.map((col) => (
            <div key={col.tactic} className="rounded-md border border-white/10 bg-[#0d101b] p-2.5">
              <p className="border-b border-white/10 pb-1.5 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: col.color }}>
                {col.tactic}
              </p>
              <div className="mt-2 space-y-1.5">
                {col.items.map((tech) => (
                  <button
                    key={tech.id}
                    type="button"
                    onMouseEnter={() => setHoverTech(tech)}
                    onFocus={() => setHoverTech(tech)}
                    onClick={() => onOpenProject?.(tech.project)}
                    className="group block w-full rounded border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-[var(--k-accent,#a78bfa)]/60 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                      <span className="text-white/55">{tech.id}</span>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: col.color, boxShadow: `0 0 6px ${col.color}` }}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium text-white group-hover:text-[var(--k-accent,#d9c8ff)]">
                      {tech.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-white/45">↳ {tech.project}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
