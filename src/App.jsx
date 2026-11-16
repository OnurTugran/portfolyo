import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import HeroScene from './components/HeroScene.jsx';
import PortfolioContent from './components/PortfolioContent.jsx';
import { MOTION_QUERY } from './motion.js';
import { setLenis } from './smooth.js';

gsap.registerPlugin(ScrollTrigger);

// Pürüzsüz (inertial) scroll: Lenis tekerlek/trackpad hareketini yumuşatır,
// GSAP ticker'ıyla aynı karede çalışır → ScrollTrigger animasyonları akıcı ve senkron.
function useSmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia(MOTION_QUERY).matches) return undefined;

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      // Pencere içi kaydırılabiliyorsa onu kaydır, kenara gelince sayfaya devret (imleç pencere üstündeyken takılmasın).
      allowNestedScroll: true,
    });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
}

export default function App() {
  useSmoothScroll();

  return (
    <main className="bg-black text-white">
      <HeroScene />
      <PortfolioContent />
    </main>
  );
}
