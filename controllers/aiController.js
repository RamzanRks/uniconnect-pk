const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const ProjectPost = require('../models/ProjectPost');

const KEY = () => process.env.GEMINI_API_KEY;

const gemini = async (prompt) => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
  });
  if (!r.ok) throw new Error('Gemini error');
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
};

const profileSummary = (u, certCount) => `Name: ${u.firstName} ${u.lastName}; University: ${u.university}; Major: ${u.major}; Headline: ${u.headline || 'none'}; Skills: ${(u.skills || []).join(', ') || 'none'}; Bio length: ${(u.superBio || '').length}; Certificates: ${certCount}; Education entries: ${(u.education || []).length}; Links: ${[u.links?.github, u.links?.linkedin, u.links?.website].filter(Boolean).length}; Has avatar: ${!!u.avatarUrl}; Has banner: ${!!u.bannerUrl}`;

const getCoach = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const certCount = await Certificate.countDocuments({ user: user._id });
  const projectCount = await ProjectPost.countDocuments({ creator: user._id });
  const checks = [
    ['avatar', !!user.avatarUrl, 'Upload a profile photo'],
    ['headline', !!user.headline, 'Add a professional headline'],
    ['superBio', (user.superBio || '').length > 50, 'Write a super bio (50+ chars)'],
    ['skills', (user.skills || []).length >= 3, 'Add at least 3 skills'],
    ['links', !!(user.links?.github || user.links?.linkedin || user.links?.website), 'Attach GitHub/LinkedIn/website'],
    ['education', (user.education || []).length > 0, 'Add your education'],
    ['certs', certCount > 0, 'Upload a certificate'],
    ['banner', !!user.bannerUrl, 'Set a portfolio banner'],
  ];
  const passed = checks.filter((c) => c[1]).length;
  const completeness = Math.round((passed / checks.length) * 100);
  const missing = checks.filter((c) => !c[1]).map((c) => c[2]);

  const fresh = user.coachCache?.at && (Date.now() - new Date(user.coachCache.at).getTime() < 24 * 3600 * 1000);
  if (fresh && user.coachCache.score) return res.json({ score: user.coachCache.score, tips: user.coachCache.tips, missing, ai: true });

  let tips = missing.slice(0, 4);
  let quality = completeness;
  let ai = false;
  if (KEY()) {
    try {
      const out = await gemini(`You are a strict tech recruiter evaluating a student profile for content quality. Profile: ${profileSummary(user, certCount)}; Published projects: ${projectCount}. Return JSON {"quality": <0-100 score for how compelling the written content is>, "tips": [exactly 4 specific, actionable improvement tips]}.`);
      const parsed = JSON.parse(out);
      if (Array.isArray(parsed.tips) && parsed.tips.length) tips = parsed.tips.slice(0, 4);
      if (typeof parsed.quality === 'number') quality = Math.max(0, Math.min(100, parsed.quality));
      ai = true;
    } catch (e) { /* fallback */ }
  }
  const score = Math.round((completeness + quality) / 2);
  user.coachCache = { tips, score, at: new Date(), askAt: user.coachCache?.askAt };
  await user.save();
  res.json({ score, tips, missing, ai });
});
// @desc    Gemini headline suggestions
const generateHeadlines = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!KEY()) return res.json({ headlines: [`${user.major} Student @ ${user.university} | Aspiring Developer`, `Final-year ${user.major} undergrad | Team player & builder`, `${user.major} @ ${user.university} | Open to internships & projects`] });
  try {
    const out = await gemini(`Profile: ${profileSummary(user, 0)}. Return JSON {"headlines": [3 crisp LinkedIn-style headlines under 90 chars]}.`);
    res.json(JSON.parse(out));
  } catch (e) { res.status(500); throw new Error('AI unavailable, try later'); }
});

// @desc    Gemini bio rewriter
const rewriteBio = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) { res.status(400); throw new Error('No text provided'); }
  if (!KEY()) return res.json({ rewritten: `**${text}** — passionate about building impactful projects and collaborating with talented teammates.` });
  try {
    const out = await gemini(`Rewrite this student bio professionally (keep under 500 chars, markdown **bold** allowed). Bio: "${text}". Return JSON {"rewritten": "..."}.`);
    res.json(JSON.parse(out));
  } catch (e) { res.status(500); throw new Error('AI unavailable, try later'); }
});

// @desc    Ask coach (1/day)
const askCoach = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.coachCache?.askAt && Date.now() - new Date(user.coachCache.askAt).getTime() < 24 * 3600 * 1000) {
    res.status(429); throw new Error('Daily AI question limit reached. Come back tomorrow!');
  }
  if (!KEY()) { res.status(503); throw new Error('AI not configured (add GEMINI_API_KEY).'); }
  const { question } = req.body;
  try {
    const out = await gemini(`You are a friendly career coach. Student profile: ${profileSummary(user, 0)}. Question: "${question}". Answer in under 120 words, practical, for a Pakistani university student. Return JSON {"answer": "..."}.`);
    user.coachCache = { ...(user.coachCache || {}), askAt: new Date() };
    await user.save();
    res.json(JSON.parse(out));
  } catch (e) { res.status(500); throw new Error('AI unavailable, try later'); }
});

module.exports = { getCoach, generateHeadlines, rewriteBio, askCoach };