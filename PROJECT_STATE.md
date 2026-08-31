# 🎯 UniConnect PK — Project State (War Room)

> Last updated: 28 Aug 2026 • Current milestone: **M5 — COMPLETE (local)** • Deployment: PARKED

---

## 📍 Status Snapshot
| Area | Status |
|------|--------|
| Backend (Express + MongoDB Atlas + Socket.io) | ✅ Stable locally |
| Frontend (React + Vite + Tailwind) | ✅ Stable locally |
| Milestone 5 features | ✅ Tested locally |
| Production deploy (Vercel + Replit) | ⏸️ Parked by Captain |

## 🗂️ Milestone Log
- **M1 — Core:** .edu auth, project posts, Q&A, reports, admin panel, verification. ✅
- **M2 — Engagement:** notifications, DMs, Cloudinary uploads, analytics. ✅
- **M3 — Identity:** profiles, follow system, admin-approved name changes, avatars. ✅
- **M4 — Growth (12):** dark mode, bookmarks, ratings, progress, topics/For-You, activity, profile views, pins, presence, badges, export, reactions. ✅
- **M5 — Platform Maturity (12+16):** see checklist below. ✅ (local)

## ✅ M5 Checklist (tested)
- [x] Google OAuth login + mandatory Complete-Profile gate (no skip)
- [x] Email verification (6-digit, 15-min expiry) + resend
- [x] Forgot password: 3 steps (email → code validated w/ expiry → new+confirm w/ 👁️)
- [x] Change password (logged in)
- [x] Global search: category tabs + live counts + Project Detail page
- [x] Leaderboard: fair ties (points desc, join-date asc) + "Your Rank" card
- [x] Reputation points (post +5, question +5, answer +5, accepted +15, rating +2..10, application accepted +10)
- [x] Project Teams visible on cards (clickable profiles) + backfill script
- [x] Professional Inbox: Primary/Requests/Archived/Explore tabs
- [x] Message requests: max 5 until accepted/replied (server-enforced by real count)
- [x] WhatsApp-grade chat: blue ✓✓ read receipts (real-time), 🟢 online, reply (click-quote scrolls), forward, delete-for-everyone, pin/mute/archive, emoji picker, in-chat search, media gallery, timestamps
- [x] Attachments: images 📷, any file 📄, voice notes 🎤 (with preview chip)
- [x] Groups: creator 👑 / admins 🛡️, add/remove members, creator un-removable, group photo + description, leave
- [x] Block 🚫 + Report 🚩 from chat (admins notified)
- [x] Skill endorsements (toggle, purple, counts)
- [x] Personal Dashboard + University Hubs
- [x] Admin Announcements (feed banner) + Strike Center (warn/strike/unban)
- [x] Chat opens at first unseen message; unread badge clears instantly

## ⏳ Parked / Known
- Google Console: add `http://localhost:5173` + Vercel URL to NEW client's Authorized JavaScript origins (kills 403 noise).
- `TEST_MODE=true` in backend `.env` → **MUST remove before production** (restores strict .edu rule).
- Codes print to backend terminal as `🔑 [CODE] email: 123456` (no UI banner).
- Out of test emails? Use Gmail aliases: `ramzramzramz1801+test1@gmail.com`.
- MongoDB `queryTxt ETIMEOUT` = transient internet/DNS blip, not code (type `rs` when back online).

## 🔑 Env Flags
Backend `.env`: MONGO_URI, JWT_SECRET, FRONTEND_URL, CLOUDINARY_*, EMAIL_USER, EMAIL_PASS, GOOGLE_CLIENT_ID, **TEST_MODE**
Frontend `.env`: VITE_API_URL, VITE_SERVER_URL, VITE_GOOGLE_CLIENT_ID

## 🧰 Utility Scripts (root)
`seeder.js` • `cleanupNames.js` • `fixEmailVerified.js` • `fixPoints.js` • `fixTeams.js`

## 🚀 Deployment Checklist (when ready)
1. Remove `TEST_MODE` from backend `.env`.
2. `git push` → Vercel auto-deploys frontend.
3. Replit: `git fetch origin main && git reset --hard origin/main` → new Deployment.
4. Set production envs on Vercel + Replit (incl. `VITE_GOOGLE_CLIENT_ID`).
5. Smoke test live URLs.