import { useEffect, useRef } from 'react';

const DEFAULT_THEME = {
  accent: '#a78bfa',
  accent2: '#5ee6ff',
  accentRgb: '167, 139, 250',
  wallFilter: 'none',
};

// Canlı interaktif Kali masaüstü duvar kağıdı:
//  • kali_hack_duvar.jpg + temaya duyarlı renk filtresi
//  • Ejderha ve 4 kurukafa üzerinde yavaş diyagonal neon enerji taraması
//  • Yüksek DPI siber takımyıldız parçacıkları, ince binary veri yağmuru, imleç çekimi ve tıklama sonar halkaları
export default function AmbientWallpaper({ theme = DEFAULT_THEME }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;
    const g = canvas.getContext('2d');
    if (!g) return undefined;

    let raf = 0;
    let inView = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles = [];
    const ripples = [];
    const mouse = { x: -9999, y: -9999, active: false };
    const GLYPHS = '01ABCDEF97'.split('');

    const initParticles = () => {
      const mobile = w < 640;
      const count = mobile ? 14 : 32;
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: 1.1 + (i % 3) * 0.55,
        phase: Math.random() * Math.PI * 2,
      }));
      const cols = mobile ? 6 : 14;
      drops.length = 0;
      for (let i = 0; i < cols; i++) {
        drops.push({
          x: ((i + 0.5) / cols) * w + (Math.random() - 0.5) * 24,
          y: Math.random() * h,
          speed: 0.45 + Math.random() * 0.65,
          glyph: GLYPHS[i % GLYPHS.length],
          alpha: 0.08 + Math.random() * 0.1,
        });
      }
    };

    const drops = [];
    const resize = () => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry ? entry.isIntersecting : true;
        if (inView && !raf && !document.hidden) raf = requestAnimationFrame(loop);
      },
      { threshold: 0.02 },
    );
    io.observe(root);

    const onPointerMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const rect = root.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (inside) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 || e.target.closest('[data-win], [data-k="panel"], button, a, input, [role="menu"]')) return;
      const rect = root.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 6,
        alpha: 0.72,
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    const onVis = () => {
      if (!document.hidden && inView && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVis);

    let lastTs = 0;
    const loop = (ts) => {
      raf = 0;
      if (document.hidden || !inView || !w || !h) return;
      const dt = lastTs ? Math.min((ts - lastTs) / 16.67, 2.5) : 1;
      lastTs = ts;

      const t = ts * 0.001;
      const rgb = themeRef.current?.accentRgb || '167, 139, 250';
      const accent2 = themeRef.current?.accent2 || '#5ee6ff';
      g.clearRect(0, 0, w, h);

      // 1. İnce hex / binary yağmur izleri
      g.font = '600 11px ui-monospace, Consolas, monospace';
      g.textAlign = 'center';
      for (const d of drops) {
        d.y += d.speed * dt;
        if (d.y > h + 24) {
          d.y = -20;
          d.glyph = GLYPHS[Math.floor((ts + d.x) % GLYPHS.length)];
        }
        g.fillStyle = `rgba(${rgb}, ${d.alpha.toFixed(2)})`;
        g.fillText(d.glyph, d.x, d.y);
      }

      // 2. Siber takımyıldız düğümleri & ağ bağlantıları
      const linkDist = w < 640 ? 95 : 135;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.2;
            g.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
            g.lineWidth = 0.85;
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(q.x, q.y);
            g.stroke();
          }
        }

        if (mouse.active) {
          const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (md < 165) {
            const ma = (1 - md / 165) * 0.42;
            g.strokeStyle = `rgba(${rgb}, ${ma.toFixed(3)})`;
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(mouse.x, mouse.y);
            g.stroke();
          }
        }

        const pulse = 0.45 + 0.35 * Math.sin(t * 1.8 + p.phase);
        g.fillStyle = `rgba(${rgb}, ${pulse.toFixed(2)})`;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
      }

      // 3. İmleç radyal aura
      if (mouse.active) {
        const grad = g.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        grad.addColorStop(0, `rgba(${rgb}, 0.14)`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        g.fill();
      }

      // 4. Duvar kağıdına tıklama sonar halkaları
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 3.6 * dt;
        rp.alpha *= Math.pow(0.955, dt);
        if (rp.alpha < 0.02) {
          ripples.splice(i, 1);
          continue;
        }
        g.strokeStyle = `rgba(${rgb}, ${rp.alpha.toFixed(3)})`;
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = accent2;
        g.globalAlpha = rp.alpha * 0.45;
        g.lineWidth = 1;
        g.beginPath();
        g.arc(rp.x, rp.y, rp.r * 0.68, 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = 1;
      }

      raf = requestAnimationFrame(loop);
    };

    if (!document.hidden && inView) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const accent = theme?.accent || DEFAULT_THEME.accent;
  const accent2 = theme?.accent2 || DEFAULT_THEME.accent2;

  return (
    <div ref={rootRef} data-k="wall" className="absolute inset-0 bg-black" aria-hidden="true">
      <img
        src={`${import.meta.env.BASE_URL}assets/kali_hack_duvar.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-700"
        style={{ filter: theme?.wallFilter || 'none' }}
        decoding="async"
      />

      {/* Duvar kağıdındaki Kali ejderhası ve 4 kurukafa üzerinde yavaş enerji dalgası */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: 'screen' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="aw-kali-mask-boost" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.3 0.5 1.35 0 -0.22  0.3 0.5 1.35 0 -0.22  0.3 0.5 1.35 0 -0.22  0 0 0 1 0" />
          </filter>
          <filter id="aw-kali-bloom" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <linearGradient id="aw-kali-sweep-grad" x1="0" y1="0" x2="1" y2="0.28">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="28%" stopColor={accent} stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.88" />
            <stop offset="70%" stopColor={accent2} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accent2} stopOpacity="0" />
          </linearGradient>
          <mask id="aw-kali-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <rect x="0" y="0" width="1920" height="1080" fill="#000" />
            <image
              href={`${import.meta.env.BASE_URL}assets/kali_hack_duvar.jpg`}
              x="0"
              y="0"
              width="1920"
              height="1080"
              preserveAspectRatio="none"
              filter="url(#aw-kali-mask-boost)"
            />
          </mask>
        </defs>
        <g mask="url(#aw-kali-mask)">
          <rect className="aw-dragon-sweep" x="-420" y="-80" width="420" height="1240" fill="url(#aw-kali-sweep-grad)" opacity="0.58" />
        </g>
        <g filter="url(#aw-kali-bloom)" opacity="0.65">
          <g mask="url(#aw-kali-mask)">
            <rect className="aw-dragon-sweep" x="-420" y="-80" width="420" height="1240" fill="url(#aw-kali-sweep-grad)" opacity="0.58" />
          </g>
        </g>
      </svg>

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ mixBlendMode: 'screen' }} />

      {/* Pencerelerin okunurluğu için vinyet */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.58)_100%)]" />
    </div>
  );
}
