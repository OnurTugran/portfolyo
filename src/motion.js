// Scroll animasyonları hangi koşulda çalışsın?
// 'all' → herkeste çalışır (Windows'ta "Animasyon efektleri" kapalı olsa bile).
// İşletim sisteminin "hareketi azalt" ayarına saygı göstermek istersen:
//   export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';
export const MOTION_QUERY = 'all';
