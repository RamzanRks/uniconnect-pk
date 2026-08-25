# 🎓 UniConnect PK — Verified Student Collaboration Network

A full-stack, production-grade platform connecting university students across Pakistan for **project collaboration, peer Q&A, and verified networking** — with a complete Trust & Safety moderation system.

## 🌐 Live Demo
- **Frontend:** (your Vercel URL here)
- **Backend API:** (your Render URL here)

## ✨ Features
- 🔐 **Strict `.edu` Registration** — only university emails can join; JWT auth + Role-Based Access Control (Student / Admin)
- 🪪 **Verified Badge Pipeline** — students upload ID cards; admins approve/reject from a moderation panel
- 📌 **Project Partner Board** — post projects, search & filter by skill/university, apply, and accept/reject applicants
- 💡 **Student Q&A** — StackOverflow-style threads with accepted solutions and "Solved" badges
- 🛡️ **Trust & Safety** — community reporting, automated 3-strike auto-hide, admin delete/ban powers
- ⚡ **Production NFRs** — rate limiting, Helmet security headers, CORS policy, bcrypt hashing, DB indexing, pagination, centralized error handling

## 🛠️ Tech Stack
| Layer     | Technology |
|-----------|------------|
| Frontend  | React (Vite), Tailwind CSS, Axios, React Router |
| Backend   | Node.js, Express, JWT, Multer (file uploads) |
| Database  | MongoDB Atlas (Mongoose ODM) |
| Hosting   | Vercel (frontend) + Render (backend) |

## 🏗️ Architecture

- **Frontend:** https://uniconnect-pk-six.vercel.app
- **Backend API:** https://uniconnect-pk--ramzannnkarim.replit.app