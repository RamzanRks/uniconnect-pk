/* Shared portfolio theme tokens — guarantees readable text on every theme */
const hexToRgb = (hex) => {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return { r: 37, g: 99, b: 235 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const luminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const mix = (hex, target, t) => {
  const a = hexToRgb(hex), b = hexToRgb(target);
  const c = (x, y) => Math.round(x + (y - x) * t);
  const to = (v) => v.toString(16).padStart(2, '0');
  return `#${to(c(a.r, b.r))}${to(c(a.g, b.g))}${to(c(a.b, b.b))}`;
};
/* darken until readable on white */
export const readableOnLight = (hex) => {
  let c = String(hex || '#2563eb');
  for (let i = 0; i < 8 && luminance(c) > 0.32; i++) c = mix(c, '#000000', 0.18);
  return c;
};
/* lighten until readable on black */
export const readableOnDark = (hex) => {
  let c = String(hex || '#2563eb');
  for (let i = 0; i < 8 && luminance(c) < 0.35; i++) c = mix(c, '#ffffff', 0.18);
  return c;
};

export const getPortfolioTokens = (theme, rawAccent = '#2563eb', rawAccent2 = '#a855f7') => {
  const lightCard = theme === 'modern' || theme === 'gradient';
  const darkCard = !lightCard;
  const accent  = lightCard ? readableOnLight(rawAccent)  : readableOnDark(rawAccent);
  const accent2 = lightCard ? readableOnLight(rawAccent2) : readableOnDark(rawAccent2);
  const scrim = (a) => `linear-gradient(rgba(8,12,22,${a}), rgba(8,12,22,${a}))`;

  let pageBg, cardBg, cardClass;
  if (theme === 'dark') {
    pageBg = '#0b0f19';
    cardBg = 'rgba(15,23,42,0.78)';
    cardClass = 'backdrop-blur-xl border';
  } else if (theme === 'glass') {
    pageBg = `${scrim(0.48)}, linear-gradient(135deg, ${rawAccent}, ${rawAccent2})`;
    cardBg = 'rgba(255,255,255,0.12)';
    cardClass = 'backdrop-blur-xl border';
  } else if (theme === 'gradient') {
    pageBg = `${scrim(0.16)}, linear-gradient(135deg, ${rawAccent}, ${rawAccent2})`;
    cardBg = '#ffffff';
    cardClass = 'border shadow-2xl';
  } else {
    pageBg = '#f3f4f6';
    cardBg = '#ffffff';
    cardClass = 'border shadow-lg';
  }

  const chipText = (luminance(rawAccent) + luminance(rawAccent2)) / 2 > 0.42 ? '#111827' : '#ffffff';

  return {
    lightCard, darkCard,
    pageBg, cardBg, cardClass,
    accent, accent2, rawAccent, rawAccent2,
    text:      lightCard ? '#111827' : '#ffffff',
    textClass: lightCard ? 'text-gray-900' : 'text-white',
    sub:       lightCard ? '#6b7280' : 'rgba(255,255,255,0.82)',
    subClass:  lightCard ? 'text-gray-500' : 'text-white/80',
    head:      lightCard ? accent : '#ffffff',
    chipText,
    border:    lightCard ? 'rgba(17,24,39,0.10)' : 'rgba(255,255,255,0.22)',
    navClass:  lightCard ? 'bg-white/85 border-gray-200/70' : 'bg-black/35 border-white/15',
  };
};