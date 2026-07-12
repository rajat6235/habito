# Habito — App Summary

**What it is**: A personal wellness PWA — a "Personal Operating System" for building habits, tracking goals, and managing daily life. Deployed at `urhabito.vercel.app` (frontend on Vercel, backend on Render, database on Neon PostgreSQL).

---

## Core Modules

| Module | What it does |
|---|---|
| **Habits** | Create habits with frequency (daily/weekly/custom), log completions, track streaks, archive, categorise |
| **Journal** | Daily journal entries with mood tracking (morning/evening), day rating, tags, draft support |
| **Goals** | Set goals with progress tracking (numeric/percentage/boolean), milestones, target dates, categories |
| **Planner** | Daily task planner — create/reorder tasks per day, carry incomplete tasks forward to next day |
| **Recovery** | Sobriety/addiction recovery tracker — goals with real-time sobriety clock, pause/resume, relapse logging with history |
| **Dashboard** | Overview of today's habits, streaks, quick links to journal and achievements |

## Supporting Features

| Feature | What it does |
|---|---|
| **Auth** | Register/login with JWT + httpOnly refresh cookie, token rotation, password reset via email |
| **Analytics** | Usage stats and progress charts (page exists, data from habits/goals) |
| **Calendar** | Visual calendar view of activity |
| **Search** | Global search across content |
| **Notes** | Freeform notes |
| **Achievements** | XP and level system tied to habit completions |
| **Settings** | Profile, theme, session management |

## Admin Panel (/admin)

- User list with search/filter by status/role
- View individual user's habits, journals, goals, tasks
- Enable/disable/delete users
- Audit logs, feature flags, global settings, system stats

## Infrastructure

- **Email**: Resend (verification + password reset) — domain verification pending for production
- **Auth**: Roles (super_admin, admin, user), RBAC middleware, rate limiting
- **PWA**: Offline support, service worker, installable
- **Background jobs**: Daily snapshots, streak recalculation, token cleanup
