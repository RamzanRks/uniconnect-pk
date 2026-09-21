const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const WORKER_URL = process.env.PARTICLE_SERVICE_URL || 'http://127.0.0.1:8100';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const OUT_DIR = path.join(__dirname, '..', 'uploads', 'particle');

const abs = (u) => (u && u.startsWith('http') ? u : `${SERVER_URL}${u}`);

async function generateForUser(userId) {
  const user = await User.findById(userId);
  if (!user || !user.avatarUrl) return null;
  try {
    const imgRes = await fetch(abs(user.avatarUrl));
    if (!imgRes.ok) throw new Error('avatar fetch ' + imgRes.status);
    const buf = Buffer.from(await imgRes.arrayBuffer());

    const form = new FormData();
    form.append('file', new Blob([buf], { type: 'image/jpeg' }), 'avatar.jpg');
    const res = await fetch(`${WORKER_URL}/process`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('worker ' + res.status);
    const png = Buffer.from(await res.arrayBuffer());

    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, `${userId}.png`), png);

    user.particleCutoutUrl = `/uploads/particle/${userId}.png`;
    await user.save();
    return user.particleCutoutUrl;
  } catch (err) {
    console.error('[particle] generation failed for', userId, err.message);
    return null; // never throw — uploads & logins must stay unaffected
  }
}

function queueParticleProcessing(userId) {
  setImmediate(() => { generateForUser(userId).catch(() => {}); });
}

async function saveCutoutForUser(userId, buffer) {
  const user = await User.findById(userId);
  if (!user) return null;
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${userId}.png`), buffer);
  user.particleCutoutUrl = `/uploads/particle/${userId}.png?v=${Date.now()}`; // cache-bust
  await user.save();
  return user.particleCutoutUrl;
}

module.exports = { generateForUser, queueParticleProcessing, saveCutoutForUser };