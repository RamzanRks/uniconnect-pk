const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const { sendMail } = require('./utils/mailer');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 60000, connectTimeoutMS: 60000 });
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await User.find({ isBanned: false });
  let sent = 0;
  for (const u of users) {
    const notif = await Notification.countDocuments({ recipient: u._id, createdAt: { $gte: weekAgo } });
    const text = [
      `Hi ${u.firstName}, here is your UniConnect PK weekly digest 📈`,
      ``,
      `🪙 Reputation points: ${u.points || 0}`,
      `👥 Followers: ${(u.followers || []).length}`,
      `🔔 Notifications this week: ${notif}`,
      ``,
      `Keep building, keep climbing the leaderboard!`,
    ].join('\n');
    try { await sendMail({ to: u.email, subject: '📈 Your UniConnect PK Weekly Digest', text }); sent++; } catch (e) { /* skip */ }
  }
  console.log(`✅ Weekly digest sent to ${sent}/${users.length} users`);
  process.exit(0);
};
run();