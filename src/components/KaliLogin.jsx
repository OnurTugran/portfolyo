import { forwardRef } from 'react';
import gsap from 'gsap';
import { Clock, Icon, P } from './KaliDesktop.jsx';
import { playKeyClick, playLoginSuccess } from '../sfx.js';

const USER = P.user;
const STARS = 8;

// Monitör ekranının içi: Kali tarzı giriş (LightDM) ekranı.
// Arka plan, monitördeki ejderha ekranının aynısı → zoom'dan geçiş dikiş yeri göstermiyor.
const KaliLogin = forwardRef(function KaliLogin(_props, ref) {
  return (
    <div
      ref={ref}
      className="k-login invisible absolute inset-0 z-10 overflow-hidden font-sans text-white opacity-0"
      aria-label="Kali Linux giriş ekranı"
    >
      {/* Arka plan: monitörde uzaktan görünen ekranın (UzaktanMasaüstü) aynısı, zoom'un bittiği kadrajla.
          Zoom ekranı pencere yüksekliğinin %104'üne büyütüyor → görsel de öyle; geçişte dikiş olmuyor. */}
      <img
        src={`${import.meta.env.BASE_URL}assets/uzaktan_masaustu.jpg`}
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[104%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2"
        decoding="async"
      />
      {/* Gerçek Kali Plymouth açılış ejderha parıltısı */}
      <svg
        viewBox="0 0 1920 1080"
        width="1920"
        height="1080"
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-video h-[104%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <defs>
          <filter id="login-kali-mask-boost" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0 0 1.55 0 -0.12  0 0 1.55 0 -0.12  0 0 1.55 0 -0.12  0 0 0 1 0" />
          </filter>
          <filter id="login-kali-bloom" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <linearGradient id="login-kali-sweep-grad" x1="0" y1="0" x2="1" y2="0.28">
            <stop offset="0%" stopColor="#1f6fff" stopOpacity="0" />
            <stop offset="24%" stopColor="#2da8ff" stopOpacity="0.48" />
            <stop offset="46%" stopColor="#b8f0ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="58%" stopColor="#5ce1ff" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#2d8cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1f6fff" stopOpacity="0" />
          </linearGradient>
          <mask id="login-kali-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <rect x="0" y="0" width="1920" height="1080" fill="#000" />
            <image
              href={`${import.meta.env.BASE_URL}assets/uzaktan_masaustu.jpg`}
              x="0"
              y="0"
              width="1920"
              height="1080"
              preserveAspectRatio="xMidYMid meet"
              filter="url(#login-kali-mask-boost)"
            />
            <rect x="0" y="960" width="240" height="120" fill="#000" />
          </mask>
        </defs>
        <g mask="url(#login-kali-mask)" style={{ mixBlendMode: 'screen' }}>
          <rect className="kali-dragon-sweep" x="-480" y="-80" width="460" height="1240" fill="url(#login-kali-sweep-grad)" opacity="0.72" />
          <rect data-l="dragon-enter-sweep" x="-480" y="-80" width="520" height="1240" fill="url(#login-kali-sweep-grad)" opacity="0" />
        </g>
        <g filter="url(#login-kali-bloom)" opacity="0.85" style={{ mixBlendMode: 'screen' }}>
          <g mask="url(#login-kali-mask)">
            <rect className="kali-dragon-sweep" x="-480" y="-80" width="460" height="1240" fill="url(#login-kali-sweep-grad)" opacity="0.72" />
            <rect data-l="dragon-enter-sweep" x="-480" y="-80" width="520" height="1240" fill="url(#login-kali-sweep-grad)" opacity="0" />
          </g>
        </g>
      </svg>

      {/* Üst çubuk */}
      <div className="relative flex h-8 items-center justify-between bg-black/35 px-4 text-xs text-white/70">
        <span className="w-12" aria-hidden="true" />
        <Clock showDate className="tabular-nums" />
        <span className="flex w-12 items-center justify-end gap-3">
          {Icon.wifi}
          {Icon.power}
        </span>
      </div>

      {/* Giriş kartı */}
      <div className="absolute inset-0 grid place-items-center px-4">
        <div
          data-l="card"
          className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-[#070b1f]/85 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <div className="flex flex-col items-center text-center">
            {/* Kullanıcı resmi (public/assets/profil.jpg, 736×688; kare kırpılıp küçültülür) */}
            <span className="block h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-black shadow-[0_0_0_4px_rgba(255,255,255,0.03)]">
              <img
                src={`${import.meta.env.BASE_URL}assets/profil.jpg`}
                alt=""
                className="h-full w-full object-cover"
                decoding="async"
              />
            </span>
            <p lang="en" className="mt-3 font-mono text-[11px] uppercase tracking-[0.35em] text-white/45">{P.host} login</p>
            <p lang="en" className="mt-1 font-mono text-[9.5px] tracking-[0.14em] text-white/35">root GUI disabled · least privilege</p>
          </div>

          <div className="mt-6 space-y-4" aria-hidden="true">
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">Kullanıcı Adı</p>
              <div
                data-l="userField"
                className="flex h-10 items-center rounded-md border border-white/15 bg-black/40 px-3 font-mono text-sm text-white"
              >
                <span data-l="user" className="k-type">
                  {USER}
                </span>
                <span data-l="caret" className="k-caret ml-px" />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">Şifre</p>
              <div
                data-l="passField"
                className="flex h-10 items-center rounded-md border border-white/15 bg-black/40 px-3 font-mono text-base text-white"
              >
                {/* Yıldızlar yazıldıkça görünür (display) → imleç her zaman son yıldızın hemen arkasında. */}
                {Array.from({ length: STARS }, (_, i) => (
                  <span key={i} data-l="star" className="hidden w-[1ch] translate-y-[3px]">
                    *
                  </span>
                ))}
                <span data-l="caret" className="k-caret invisible ml-px" />
              </div>
            </div>

            <div
              data-l="enter"
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#367bf0] text-sm font-medium text-white"
            >
              Enter
              <span className="font-mono text-base leading-none">↵</span>
            </div>

            <p data-l="ok" className="text-center font-mono text-[11px] text-[#7ee2a0] opacity-0">
              ✓ {P.user}@{P.host} doğrulandı — oturum açılıyor…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default KaliLogin;

// ─── Scroll timeline'ı: ekran uyanır → "onur" yazılır → şifre dolar → Enter'a basılır ───
export function addLoginTimeline(tl, root, at) {
  const q = (s) => root.querySelector(s);
  const qa = (s) => [...root.querySelectorAll(s)];
  const card = q('[data-l="card"]');
  const user = q('[data-l="user"]');
  const [userCaret, passCaret] = qa('[data-l="caret"]');
  const userField = q('[data-l="userField"]');
  const passField = q('[data-l="passField"]');
  const stars = qa('[data-l="star"]');
  const enter = q('[data-l="enter"]');
  const ok = q('[data-l="ok"]');
  const enterSweeps = qa('[data-l="dragon-enter-sweep"]');

  const FOCUS = 'rgba(111, 156, 255, 0.85)';
  const IDLE = 'rgba(255, 255, 255, 0.15)';

  gsap.set(root, { autoAlpha: 0 });
  gsap.set(card, { autoAlpha: 0, y: 18 });
  gsap.set(user, { width: '0ch' });
  gsap.set(stars, { display: 'none' });
  gsap.set(enterSweeps, { x: 0, opacity: 0 });

  // Ekran ışığı lacivertten giriş ekranına döner, kart yukarı süzülür.
  tl.to(root, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, at);
  tl.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '>-0.1');

  // 1) Kullanıcı adı: harf harf "onur".
  tl.to(userField, { borderColor: FOCUS, duration: 0.2 }, '>+0.1');
  tl.to(user, { width: `${USER.length}ch`, duration: 0.9, ease: `steps(${USER.length})` }, '>');
  Array.from({ length: USER.length }, (_, i) =>
    tl.call(() => playKeyClick(), null, `<+${(i * 0.22).toFixed(2)}`),
  );
  tl.to({}, { duration: 0.3 });

  // 2) Şifre: odak alt alana geçer, yıldızlar tek tek düşer.
  tl.to(userField, { borderColor: IDLE, duration: 0.2 }, '>');
  tl.set(userCaret, { autoAlpha: 0 }, '<');
  tl.set(passCaret, { autoAlpha: 1 }, '<');
  tl.to(passField, { borderColor: FOCUS, duration: 0.2 }, '<');
  stars.forEach((s, i) => {
    tl.set(s, { display: 'inline-block' }, i ? '>+0.13' : '>+0.1');
    tl.call(() => playKeyClick(), null, '<');
  });
  tl.to({}, { duration: 0.13 });
  tl.to({}, { duration: 0.3 });

  // 3) Enter: buton basılır (küçülür), sonra parlar.
  tl.set(passCaret, { autoAlpha: 0 }, '>');
  tl.to(passField, { borderColor: IDLE, duration: 0.2 }, '<');
  tl.to(enter, { scale: 0.95, filter: 'brightness(0.85)', duration: 0.18, ease: 'power2.in' }, '>');
  tl.addLabel('enterGlow', '>');
  tl.to(
    enter,
    {
      scale: 1,
      filter: 'brightness(1.35)',
      boxShadow: '0 0 0 3px rgba(111,156,255,0.45), 0 0 46px 10px rgba(54,123,240,0.65)',
      duration: 0.45,
      ease: 'power2.out',
    },
    'enterGlow',
  );
  tl.call(() => playLoginSuccess(), null, 'enterGlow');
  tl.set(enterSweeps, { opacity: 1 }, 'enterGlow')
    .fromTo(enterSweeps, { x: 0 }, { x: 2450, duration: 0.95, ease: 'power2.out' }, 'enterGlow')
    .set(enterSweeps, { opacity: 0 }, 'enterGlow+=0.95');
  tl.to(ok, { opacity: 1, duration: 0.3 }, 'enterGlow+=0.15');
  tl.to({}, { duration: 0.5 });
}
