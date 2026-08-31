const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ProjectPost = require('../models/ProjectPost');
const Question = require('../models/Question');

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const SYNONYM_MAP = {
  js: 'javascript', reactjs: 'react', 'react.js': 'react', nodejs: 'node', 'node.js': 'node',
  py: 'python', ml: 'machine learning', ai: 'artificial intelligence', cs: 'computer science',
};

const levenshtein = (a, b) => {
  const m = a.length; const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[m][n];
};

// @desc    Global search with synonyms + "did you mean"
// @route   GET /api/search?q=
const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ counts: { users: 0, projects: 0, questions: 0 }, users: [], projects: [], questions: [], didYouMean: null });

  const lower = q.toLowerCase();
  const expanded = SYNONYM_MAP[lower] || null;
  const terms = expanded ? [q, expanded] : [q];
  const or = (fields) => terms.flatMap((t) => fields.map((f) => ({ [f]: new RegExp(escapeRegex(t), 'i') })));

  const [users, projects, questions] = await Promise.all([
    User.find({ $or: or(['firstName', 'lastName', 'username', 'university']), isBanned: false })
      .select('firstName lastName username avatarUrl university points').limit(20),
    ProjectPost.find({ $or: or(['title', 'description']), status: { $ne: 'hidden' } })
      .select('title requiredSkills creator progress').populate('creator', 'firstName lastName avatarUrl').limit(20),
    Question.find({ $or: or(['title', 'content']), status: 'open' })
      .select('title author').populate('author', 'firstName lastName avatarUrl').limit(20),
  ]);

  let didYouMean = null;
  if (users.length + projects.length + questions.length === 0) {
    const [uList, pList, sList] = await Promise.all([
      User.find({ isBanned: false }).select('firstName lastName username').limit(300),
      ProjectPost.find().select('title').limit(300),
      ProjectPost.distinct('requiredSkills'),
    ]);
    const corpus = new Set();
    uList.forEach((u) => { corpus.add((u.firstName || '').toLowerCase()); corpus.add((u.lastName || '').toLowerCase()); corpus.add((u.username || '').toLowerCase()); });
    pList.forEach((p) => String(p.title).toLowerCase().split(/\s+/).forEach((t) => corpus.add(t)));
    sList.forEach((s) => corpus.add(String(s).toLowerCase()));

    let best = null; let bestDist = 3;
    for (const token of corpus) {
      if (!token) continue;
      const d = levenshtein(lower, token);
      if (d < bestDist) { bestDist = d; best = token; }
    }
    didYouMean = best;
  }

  res.json({ counts: { users: users.length, projects: projects.length, questions: questions.length }, users, projects, questions, didYouMean });
});

// @desc    Trending skills & universities
// @route   GET /api/search/trending
const getTrending = asyncHandler(async (req, res) => {
  const [skills, universities] = await Promise.all([
    ProjectPost.aggregate([{ $unwind: '$requiredSkills' }, { $group: { _id: '$requiredSkills', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    User.aggregate([{ $group: { _id: '$university', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
  ]);
  res.json({ skills, universities });
});

module.exports = { globalSearch, getTrending };