import { forwardRef } from 'react';
import gsap from 'gsap';
import { Icon, P, day, hhmm, useClock } from './KaliDesktop.jsx';

const USER = 'root';
const STARS = 8;

// Monitör ekranının içi: Kali tarzı giriş (LightDM) ekranı.
// Arka plan, monitördeki ejderha ekranının aynısı → zoom'dan geçiş dikiş yeri göstermiyor.
const KaliLogin = forwardRef(function KaliLogin(_props, ref) {
  const now = useClock();

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

      {/* Üst çubuk */}
      <div className="relative flex h-8 items-center justify-between bg-black/35 px-4 text-xs text-white/70">
        <span className="w-12" aria-hidden="true" />
        <span className="tabular-nums">
          {day(now)} {hhmm(now)}
        </span>
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
              ✓ kimlik doğrulandı — oturum açılıyor…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default KaliLogin;

// ─── Scroll timeline'ı: ekran uyanır → "root" yazılır → şifre dolar → Enter'a basılır ───
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

  const FOCUS = 'rgba(111, 156, 255, 0.85)';
  const IDLE = 'rgba(255, 255, 255, 0.15)';

  gsap.set(root, { autoAlpha: 0 });
  gsap.set(card, { autoAlpha: 0, y: 18 });
  gsap.set(user, { width: '0ch' });
  gsap.set(stars, { display: 'none' });

  // Ekran ışığı lacivertten giriş ekranına döner, kart yukarı süzülür.
  tl.to(root, { autoAlpha: 1, duration: 0.7, ease: 'power1.inOut' }, at);
  tl.to(card, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '>-0.1');

  // 1) Kullanıcı adı: harf harf "root".
  tl.to(userField, { borderColor: FOCUS, duration: 0.2 }, '>+0.1');
  tl.to(user, { width: `${USER.length}ch`, duration: 0.9, ease: `steps(${USER.length})` }, '>');
  tl.to({}, { duration: 0.3 });

  // 2) Şifre: odak alt alana geçer, yıldızlar tek tek düşer.
  tl.to(userField, { borderColor: IDLE, duration: 0.2 }, '>');
  tl.set(userCaret, { autoAlpha: 0 }, '<');
  tl.set(passCaret, { autoAlpha: 1 }, '<');
  tl.to(passField, { borderColor: FOCUS, duration: 0.2 }, '<');
  stars.forEach((s, i) => tl.set(s, { display: 'inline-block' }, i ? '>+0.13' : '>+0.1'));
  tl.to({}, { duration: 0.13 });
  tl.to({}, { duration: 0.3 });

  // 3) Enter: buton basılır (küçülür), sonra parlar.
  tl.set(passCaret, { autoAlpha: 0 }, '>');
  tl.to(passField, { borderColor: IDLE, duration: 0.2 }, '<');
  tl.to(enter, { scale: 0.95, filter: 'brightness(0.85)', duration: 0.18, ease: 'power2.in' }, '>');
  tl.to(
    enter,
    {
      scale: 1,
      filter: 'brightness(1.35)',
      boxShadow: '0 0 0 3px rgba(111,156,255,0.45), 0 0 46px 10px rgba(54,123,240,0.65)',
      duration: 0.45,
      ease: 'power2.out',
    },
    '>',
  );
  tl.to(ok, { opacity: 1, duration: 0.3 }, '<+0.15');
  tl.to({}, { duration: 0.5 });
}
