// Uygulama genelindeki Lenis örneği (App.jsx kurar). Hero'daki otomatik açılış kaydırması bunu kullanır.
let lenis = null;
export const setLenis = (l) => (lenis = l);
export const getLenis = () => lenis;
