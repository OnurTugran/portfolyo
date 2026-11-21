import { useEffect, useRef } from 'react';

// SOC / Purple Lab penceresi için canlı çift kanallı osiloskop ve mini tehdit radarı.
// Yalnızca Çalışma Alanı 2 açık ve görünürken requestAnimationFrame çalıştırır.
export default function SocWaveform({ active, alertPulse, theme }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const alertRef = useRef(0);
  const pulseTickRef = useRef(alertPulse);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    if (alertPulse !== pulseTickRef.current) {
      pulseTickRef.current = alertPulse;
      alertRef.current = 1;
    }
  }, [alertPulse]);

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

    let lastTs = 0;
    const blips = [
      { ang: 0.7, dist: 0.56, hostile: true },
      { ang: 2.3, dist: 0.72, hostile: false },
      { ang: 3.9, dist: 0.44, hostile: true },
      { ang: 5.1, dist: 0.8, hostile: false },
    ];

    const loop = (ts) => {
      raf = 0;
      if (document.hidden || !active || !w || !h) return;
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;
      const t = ts * 0.001;

      if (alertRef.current > 0) {
        alertRef.current = Math.max(0, alertRef.current - dt * 0.45);
      }
      const alert = alertRef.current;
      const accent = themeRef.current?.accent || '#c4a1ff';
      const accent2 = themeRef.current?.accent2 || '#5ee6ff';

      g.clearRect(0, 0, w, h);
      g.fillStyle = '#070a11';
      g.fillRect(0, 0, w, h);

      const showRadar = w >= 340;
      const scopeW = showRadar ? w * 0.73 : w;

      // Arka ızgara
      g.strokeStyle = alert > 0.25 ? `rgba(255, 77, 125, ${(0.08 + alert * 0.14).toFixed(2)})` : 'rgba(130, 170, 255, 0.08)';
      g.lineWidth = 1;
      for (let gx = 0; gx < scopeW; gx += 28) {
        g.beginPath();
        g.moveTo(gx, 0);
        g.lineTo(gx, h);
        g.stroke();
      }
      for (let gy = 0; gy < h; gy += 22) {
        g.beginPath();
        g.moveTo(0, gy);
        g.lineTo(scopeW, gy);
        g.stroke();
      }

      // Kanal 1: normal ağ trafiği
      g.strokeStyle = '#5ee6ff';
      g.lineWidth = 1.4;
      g.beginPath();
      for (let x = 0; x <= scopeW; x += 2) {
        const u = x / scopeW;
        const y =
          h * 0.46 +
          Math.sin(u * 14 - t * 4.2) * (h * 0.14) +
          Math.sin(u * 34 + t * 7.5) * (h * 0.05);
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();

      // Kanal 2: Isolation Forest / anomali dalgası (saldırı anında keskin sıçrama)
      const ch2Color = alert > 0.2 ? '#ff4d7d' : accent;
      g.strokeStyle = ch2Color;
      g.lineWidth = 1.7 + alert * 0.9;
      g.shadowColor = ch2Color;
      g.shadowBlur = 4 + alert * 8;
      g.beginPath();
      for (let x = 0; x <= scopeW; x += 2) {
        const u = x / scopeW;
        const burst = Math.sin(u * 42 + t * 14) * Math.sin(u * 9 - t * 6);
        const env = 0.06 + alert * 0.34;
        const y = h * 0.62 + burst * (h * env) + Math.cos(u * 19 - t * 5) * (h * 0.06);
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;

      // Tarama çizgisi
      const sweepX = ((t * 95) % scopeW);
      const sg = g.createLinearGradient(sweepX - 32, 0, sweepX, 0);
      sg.addColorStop(0, 'rgba(0,0,0,0)');
      sg.addColorStop(1, alert > 0.25 ? 'rgba(255,77,125,0.22)' : 'rgba(110,255,190,0.16)');
      g.fillStyle = sg;
      g.fillRect(Math.max(0, sweepX - 32), 0, 32, h);

      // Etiketler
      g.font = '600 9.5px ui-monospace, Consolas, monospace';
      g.fillStyle = 'rgba(255,255,255,0.48)';
      g.fillText('TRAFFIC STREAM', 10, 14);
      g.fillStyle = alert > 0.25 ? '#ff7aa8' : '#6effbe';
      g.fillText(alert > 0.25 ? '▲ ANOMALY SPIKE' : '● BASELINE NOMINAL', 10, h - 8);

      // Sağda Mini Radar
      if (showRadar) {
        const divX = scopeW;
        g.strokeStyle = 'rgba(255,255,255,0.08)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(divX, 6);
        g.lineTo(divX, h - 6);
        g.stroke();

        const rx = divX + (w - divX) * 0.5;
        const ry = h * 0.5;
        const R = Math.min(w - divX, h) * 0.39;

        g.strokeStyle = alert > 0.2 ? 'rgba(255,77,125,0.42)' : 'rgba(110,255,190,0.28)';
        g.lineWidth = 1;
        [0.45, 0.78, 1].forEach((k) => {
          g.beginPath();
          g.arc(rx, ry, R * k, 0, Math.PI * 2);
          g.stroke();
        });
        g.beginPath();
        g.moveTo(rx - R, ry);
        g.lineTo(rx + R, ry);
        g.moveTo(rx, ry - R);
        g.lineTo(rx, ry + R);
        g.stroke();

        const ra = t * 2.5;
        g.fillStyle = alert > 0.2 ? 'rgba(255,77,125,0.18)' : 'rgba(110,255,190,0.16)';
        g.beginPath();
        g.moveTo(rx, ry);
        g.arc(rx, ry, R, ra - 0.55, ra);
        g.closePath();
        g.fill();

        g.strokeStyle = alert > 0.2 ? '#ff7aa8' : accent2;
        g.beginPath();
        g.moveTo(rx, ry);
        g.lineTo(rx + Math.cos(ra) * R, ry + Math.sin(ra) * R);
        g.stroke();

        if (alert > 0.05) {
          g.strokeStyle = `rgba(255, 77, 125, ${alert.toFixed(2)})`;
          g.lineWidth = 1.6;
          g.beginPath();
          g.arc(rx, ry, R * (1 - alert) * 1.15, 0, Math.PI * 2);
          g.stroke();
        }

        blips.forEach((b) => {
          const diff = (((ra - b.ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const glow = Math.max(0.18, 1 - diff / 3.4);
          g.fillStyle = b.hostile ? `rgba(255,90,130,${glow.toFixed(2)})` : `rgba(110,255,190,${glow.toFixed(2)})`;
          g.beginPath();
          g.arc(rx + Math.cos(b.ang) * R * b.dist, ry + Math.sin(b.ang) * R * b.dist, 2.2, 0, Math.PI * 2);
          g.fill();
        });
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
    <div ref={wrapRef} className="relative h-[86px] shrink-0 overflow-hidden border-b border-white/10 bg-[#070a11]">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}
