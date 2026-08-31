// Anti-abuse word filter (English + Roman-Urdu). Word-boundary safe (no "class" false-positives).
const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'bastard', 'whore', 'dick', 'pussy',
  'bsdk', 'chutiya', 'madarchod', 'behenchod', 'randi', 'harami', 'kamine', 'kaminey',
  'gandu', 'lodu', 'kutta', 'sale', 'saale', 'gadhha',
];

const containsProfanity = (text) => {
  const t = String(text || '').toLowerCase();
  return BAD_WORDS.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));
};

module.exports = { containsProfanity };