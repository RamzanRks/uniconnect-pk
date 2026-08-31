# 🎓 UniConnect PK

A professional social network **exclusively for Pakistani university students** (.edu / .edu.pk emails). Find teammates, build projects, answer questions, and grow your reputation — with a WhatsApp-grade inbox.

## ✨ Feature Highlights

### 🔐 Trust & Identity
- Strict `.edu` registration + 6-digit email verification (15-min expiry)
- **Google one-tap login** with mandatory profile completion gate
- Forgot / reset / change password (code-validated, expiry-checked, 👁️ show-password)
- Admin-approved ✅ Verified Student badges & legal name changes

### 📌 Projects & Q&A
- Post projects (skills, deadline, progress), apply & accept teammates
- **Project Teams** displayed on every card (clickable profiles)
- Q&A board with accepted-solution answers
- Anti-troll: 3-report auto-hide, admin moderation, strikes (3 = ban)

### 🏆 Reputation & Discovery
- Points engine: posts, answers, accepted solutions, ratings, endorsements
- **Leaderboard** with fair tie-breaking + "Your Rank #N" card
- Global search (Users / Projects / Questions tabs + live counts)
- University Hubs, Personal Dashboard, Skill Endorsements

### 📥 Professional Inbox (WhatsApp-grade)
- Message requests (max 5 until accepted) • Primary / Requests / Archived / Explore
- Real-time: typing…, 🟢 presence, blue ✓✓ read receipts, instant unread badges
- Reply (click-quote jumps to original) • Forward • Delete for everyone
- Pin / Mute / Archive • Emoji picker • In-chat search • Media gallery • Timestamps
- Attachments: images, any file, voice notes 🎤
- **Groups**: creator 👑 / admins 🛡️, add/remove members, group photo + description
- Block 🚫 & Report 🚩 (admins notified instantly)

### 🛡️ Admin Control Center
- Reports queue, verifications, name changes, analytics with drill-downs
- **Strike Center**: warn / strike / unban • Announcements broadcast banner

## 🧱 Tech Stack
- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose), Socket.io, Nodemailer, google-auth-library, Cloudinary/Multer
- **Frontend:** React (Vite), Tailwind CSS, Axios, socket.io-client, @react-oauth/google

## 🚀 Local Setup
```bash
# Backend (root)
npm install
npm run dev            # http://localhost:5000

# Frontend
cd uniconnect-frontend
npm install
npm run dev            # http://localhost:5173


- **Frontend:** https://uniconnect-pk-six.vercel.app
- **Backend API:** https://uniconnect-pk--ramzannnkarim.replit.app