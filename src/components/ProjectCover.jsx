// Proje kartlarının küçük kapak çizimleri: kodla çizilmiş çizgi sanatı (ücretsiz, keskin, hafif).
// Her proje kendi fikrini anlatır; renkler red / blue / purple tarafına göre.
const TONE = { red: '#ff8a8a', blue: '#8ab4ff', purple: '#c4a1ff', tool: '#a9b4c8' };

const grid = (
  <g stroke="currentColor" strokeOpacity="0.07" strokeWidth="1">
    {Array.from({ length: 13 }, (_, i) => (
      <path key={`v${i}`} d={`M${i * 25} 0V100`} />
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <path key={`h${i}`} d={`M0 ${i * 25}H300`} />
    ))}
  </g>
);

const ART = {
  // SSRF: istek sunucunun içinden iç ağa "hayalet" gibi sızar, WAF duvarını atlar
  'SSRF-Ghost': (c) => (
    <g fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="20" y="34" width="44" height="32" rx="4" />
      <path d="M30 46h24M30 54h16" strokeOpacity="0.6" />
      <path d="M128 18v64" strokeDasharray="4 4" strokeOpacity="0.7" />
      <text x="114" y="94" fill={c} stroke="none" fontSize="8" fontFamily="monospace" opacity="0.7">WAF</text>
      <path d="M64 50 C100 50 104 20 128 20 C152 20 156 50 192 50" strokeDasharray="2 5" className="pc-flow" />
      <g className="pc-ghost">
        <path d="M210 70 v-22 a14 14 0 0 1 28 0 v22 l-5 -5 -4 5 -5 -5 -5 5 -4 -5 z" />
        <circle cx="219" cy="48" r="2" fill={c} />
        <circle cx="229" cy="48" r="2" fill={c} />
      </g>
      <rect x="252" y="30" width="30" height="40" rx="3" strokeOpacity="0.6" />
      <path d="M258 40h18M258 48h18M258 56h12" strokeOpacity="0.4" />
    </g>
  ),
  // Dork: arama çubuğu + büyüteç, sızan dosyalar kırmızı işaretli
  'google-dork-auditor': (c) => (
    <g fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
      <rect x="18" y="16" width="190" height="20" rx="10" />
      <text x="30" y="30" fill={c} stroke="none" fontSize="9" fontFamily="monospace">site:*.com filetype:env</text>
      {[0, 1, 2].map((i) => (
        <g key={i} strokeOpacity={i === 1 ? 1 : 0.45}>
          <path d={`M24 ${52 + i * 15}h${120 - i * 18}`} />
          {i === 1 && <path d="M150 67 l6 -6 m0 6 l-6 -6" stroke="#ff8a8a" className="pc-alert-x" />}
        </g>
      ))}
      <g className="pc-scan">
        <circle cx="240" cy="58" r="20" />
        <path d="M254 72l18 18" strokeWidth="3" />
      </g>
    </g>
  ),
  // SYN tarayıcı: radar taraması, açık portlar yanar
  'Stealth-TCP-SYN-Scanner': (c) => (
    <g fill="none" stroke={c} strokeWidth="1.4">
      {[14, 28, 42].map((r) => (
        <circle key={r} cx="70" cy="50" r={r} strokeOpacity="0.5" />
      ))}
      <g className="pc-radar" style={{ transformOrigin: '70px 50px' }}>
        <path d="M70 50 L106 28" strokeWidth="2" />
        <path d="M70 50 L106 28 A42 42 0 0 1 112 50 Z" fill={c} fillOpacity="0.12" stroke="none" />
      </g>
      <circle cx="96" cy="38" r="3" fill={c} className="pc-blip" style={{ transformOrigin: '96px 38px' }} />
      <circle cx="52" cy="72" r="2.5" fill={c} fillOpacity="0.5" stroke="none" />
      <g fontFamily="monospace" fontSize="9" fill={c} stroke="none">
        <text x="140" y="34">SYN   →  22/tcp</text>
        <text x="140" y="52" opacity="0.9">SYN/ACK ← open</text>
        <text x="140" y="70" opacity="0.55">RST   →  (gizli)</text>
      </g>
    </g>
  ),
  // Netcat klonu: iki uç, aralarında soket bağlantısı ve thread'ler
  'BHP-Net-Tool': (c) => (
    <g fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
      <rect x="22" y="30" width="56" height="40" rx="4" />
      <path d="M32 44l8 6-8 6M46 58h20" />
      <rect x="222" y="30" width="56" height="40" rx="4" />
      <path d="M232 44l8 6-8 6M246 58h20" />
      {[-12, 0, 12].map((d, i) => (
        <path
          key={i}
          d={`M78 ${50 + d} C130 ${50 + d * 2} 170 ${50 - d * 2} 222 ${50 + d}`}
          strokeOpacity={i === 1 ? 1 : 0.4}
          strokeDasharray={i === 1 ? '0' : '3 4'}
          className={i === 1 ? undefined : 'pc-flow'}
        />
      ))}
      <text x="128" y="90" fill={c} stroke="none" fontSize="9" fontFamily="monospace" opacity="0.7">:4444</text>
    </g>
  ),
  // Log analizi: olay grafiği, Isolation Forest'in yakaladığı aykırı nokta
  'Log-Analayzer': (c) => (
    <g fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M18 80 H282" strokeOpacity="0.4" />
      <path d="M18 66 L44 62 L70 68 L96 60 L122 64 L148 58 L174 63 L200 22 L226 61 L252 57 L282 62" />
      <circle cx="200" cy="22" r="8" stroke="#ff8a8a" className="pc-pulse-ring" style={{ transformOrigin: '200px 22px' }} />
      <circle cx="200" cy="22" r="2.5" fill="#ff8a8a" stroke="none" />
      <text x="212" y="20" fill="#ff8a8a" stroke="none" fontSize="9" fontFamily="monospace">anomali</text>
      {[44, 96, 148, 252].map((x) => (
        <circle key={x} cx={x} cy={x === 96 ? 60 : x === 148 ? 58 : x === 44 ? 62 : 57} r="2" fill={c} stroke="none" />
      ))}
    </g>
  ),
  // omniverse: dosyalar dönüşüp tek pakete girer
  omniverse: (c) => (
    <g fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round">
      {['PDF', 'MP4', 'PNG'].map((t, i) => (
        <g key={t} transform={`translate(${24 + i * 46} ${24 + (i % 2) * 10})`}>
          <path d="M0 0h22l8 8v34H0Z" />
          <text x="3" y="30" fill={c} stroke="none" fontSize="8" fontFamily="monospace">{t}</text>
        </g>
      ))}
      <path d="M170 50h40m-8-7 8 7-8 7" className="pc-arrow" />
      <rect x="226" y="28" width="52" height="44" rx="4" />
      <path d="M226 42h52M246 28v14" strokeOpacity="0.6" />
    </g>
  ),
};

export default function ProjectCover({ name, side }) {
  const c = TONE[side] ?? TONE.tool;
  const art = ART[name];
  if (!art) return null;
  const gid = `pc-glow-${name}`;
  return (
    <svg viewBox="0 0 300 100" className="block h-20 w-full text-white" aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="50%" cy="0%" r="85%">
          <stop offset="0%" stopColor={c} stopOpacity="0.18" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="100" fill={`url(#${gid})`} className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {grid}
      {art(c)}
    </svg>
  );
}
