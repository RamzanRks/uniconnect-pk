import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Use this BEFORE rendering any user-generated content.
 */
export const sanitizeHtml = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'u', 'strong', 'em', 's', 'strike', 'del',
      'p', 'br', 'hr', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    // Force all links to open safely
    AFTER_SANITIZE_TAGS: (html) => html,
    HOOKS: {
      afterSanitizeAttributes: (node) => {
        // Force all links to open in new tab with noopener
        if (node.tagName === 'A') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
        // Force all images to have alt text
        if (node.tagName === 'IMG') {
          node.setAttribute('alt', node.getAttribute('alt') || 'Image');
        }
      },
    },
  });
};

/**
 * Sanitize plain text (strip ALL HTML tags).
 * Use for inputs that should never contain HTML.
 */
export const sanitizeText = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize a URL to prevent javascript: and data: XSS.
 */
export const sanitizeUrl = (url) => {
  if (!url) return '';
  const clean = DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(clean.trim())) {
    return '';
  }
  return clean;
};

/**
 * Sanitize a form/data payload before sending to API.
 * Strips HTML from all string values recursively.
 */
export const sanitizePayload = (obj) => {
  if (typeof obj === 'string') return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip file/binary fields
      if (value instanceof File || value instanceof Blob || value instanceof FormData) {
        clean[key] = value;
      } else {
        clean[key] = sanitizePayload(value);
      }
    }
    return clean;
  }
  return obj;
};