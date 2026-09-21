// uniconnect-frontend/src/components/BrandLogo.jsx
import { useState } from 'react';
import { BRAND } from '../utils/brand';

/**
 * Brand logo mark (+ optional wordmark).
 * If the image ever fails to load → clean gradient tile (never a broken icon).
 */
const BrandLogo = ({ size = 36, withText = false, className = '', textClassName = '' }) => {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {failed ? (
        <span
          aria-label={`${BRAND.name} ${BRAND.suffix}`}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white font-black shrink-0 shadow-sm"
          style={{ width: size, height: size, fontSize: size * 0.45 }}
        >
          U
        </span>
      ) : (
        <img
          src={BRAND.logo}
          alt={`${BRAND.name} ${BRAND.suffix}`}
          onError={() => setFailed(true)}
          className="rounded-xl object-contain shrink-0"
          style={{ width: size, height: size }}
        />
      )}

      {withText && (
  <span className={`flex flex-col leading-none text-left ${textClassName}`}>
    <span className="font-extrabold tracking-tight text-[#0A2E5C] dark:text-slate-100" style={{ fontSize: Math.max(14, size * 0.5) }}>
      {BRAND.name} <span style={{ color: BRAND.colors.cyan }}>{BRAND.suffix}</span>
    </span>
    <span className="text-gray-500 dark:text-slate-400 mt-0.5" style={{ fontSize: Math.max(9, size * 0.28) }}>
      {BRAND.tagline}
    </span>
  </span>
)}
    </span>
  );
};

export default BrandLogo;