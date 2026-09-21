// uniconnect-frontend/src/utils/brand.js
// SINGLE SOURCE OF TRUTH for the brand. Change logo here → updates everywhere.
export const BRAND = {
  name: 'UniConnect',
  suffix: 'PK',
  tagline: 'the living workshop',
  logo: 'https://res.cloudinary.com/jabmswtk/image/upload/f_auto,q_auto,w_256,h_256,c_fit/v1789910880/logo.png',
  colors: {
    navy: '#0A2E5C',
    cyan: '#00A3FF',
    blue: '#2563EB',
    violet: '#7C3AED',
  },
};

export const BRAND_LOGO_URL = BRAND.logo;
export default BRAND;