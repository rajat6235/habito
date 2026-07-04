# Habito — Wireframes v1
Low-fidelity layout contracts. Each wireframe maps screen regions to Phase-9 components and Phase-7 API endpoints.

**Legend**
```
[ ]   = interactive element (Button, Checkbox, etc.)
< >   = data slot (text, number, image)
─ │   = borders / dividers
···   = repeated items
```

---

## SHELL — App Layout (all /app/* routes)

```
Desktop (≥768px)
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px)          │ TOP BAR (h-16, sticky)               │
│ ┌──────────────────────┐ │ [ Search… ⌘K ]     [🌙] [🔔(3)]      │
│ │ habito          [<]  │ │──────────────────────────────────────│
│ ├──────────────────────┤ │                                      │
│ │ 🏠 Dashboard         │ │ MAIN CONTENT (scrollable)            │
│ │ ✅ Habits            │ │                                      │
│ │ 🛡️ Recovery          │ │ <page-specific content>              │
│ │ 📓 Journal           │ │                                      │
│ │ 🗒️ Notes             │ │                                      │
│ │ 💪 Gym               │ │                                      │
│ │ 🎯 Goals             │ │                                      │
│ │ 📅 Planner           │ │                                      │
│ │ 🗓️ Calendar          │ │                                      │
│ │ 📊 Analytics         │ │                                      │
│ │ ❤️ Life Balance      │ │                                      │
│ │ 🏆 Achievements      │ │                                      │
│ ├──────────────────────┤ │                                      │
│ │ ⚙️ Settings          │ │                                      │
│ │ [Avatar] Raj ··· [↪] │ │                                      │
│ └──────────────────────┘ │                                      │
└──────────────────────────────────────────────────────────────────┘

Mobile (<768px) — sidebar hidden, BottomNav shown
┌──────────────────────────┐
│ TOP BAR (h-16)           │
│──────────────────────────│
│                          │
│ MAIN CONTENT             │
│                          │
│──────────────────────────│
│ 🏠  ✅  📓  💪  ···     │  ← BottomNav (h-16, fixed bottom)
└──────────────────────────┘
```
**Components:** `Sidebar`, `TopBar`, `BottomNav`, `CommandPalette`, `Toaster`, `OfflineBanner`

---

## 1. DASHBOARD  `/app`

```
┌─────────────────────────────────────────────────────────┐
│ Good morning, Raj 👋                    <date>          │
│ "Your momentum is building."                            │
├─────────────────────────────────────────────────────────┤
│  STAT CARDS (4-col on xl, 2-col on md, 1-col on sm)     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Habits   │ │ Streak   │ │ Sobriety │ │ Goals    │   │
│ │  6/8 ✅  │ │  🔥 14d  │ │  47 days │ │ 3 active │   │
│ │ ↑ +2 today│ │ best 21  │ │          │ │ 1 done   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ TODAY'S HABITS                           [See all →]   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [✓] 💧 Drink water   🔥12   [Personal]             │ │
│ │ [ ] 📖 Read 20 min   🔥 5   [Learning]             │ │
│ │ [✓] 🏃 Morning run   🔥31   [Health]               │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ TODAY'S PLAN              │ RECENT JOURNAL             │
│ ┌───────────────────────┐ │ ┌────────────────────────┐ │
│ │ [ ] 09:00 Team standup│ │ │ 📓 Morning · 8:30am    │ │
│ │ [✓] 11:00 Code review │ │ │ "Feeling focused and…" │ │
│ │ [ ] 14:00 Gym session │ │ │ [Write evening entry →]│ │
│ └───────────────────────┘ │ └────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ LIFE BALANCE RADAR                                      │
│          Health ●                                       │
│        /         \                                      │
│ Self ●             ● Fitness                            │
│      |    ██████   |                                    │
│ MH ●  \  ██████  / ● Career                            │
│         Learning                                        │
│      Score: 74/100   [View full →]                      │
└─────────────────────────────────────────────────────────┘
```
**Components:** `StatCard(×4)`, `HabitCard(×N)`, `Card`, `Progress`, `Badge`  
**API:** `GET /dashboard`, `GET /habits/today`, `GET /planner/:date`, `GET /life-balance/current`

---

## 2. HABITS  `/app/habits`

```
┌─────────────────────────────────────────────────────────┐
│ Habits                         [+ New Habit] [Filter▼] │
│                                                         │
│ FILTER BAR                                              │
│ [All] [Active] [Archived]   [🔍 Search habits]         │
├─────────────────────────────────────────────────────────┤
│ TODAY — Sun, 29 Jun                     6/8 complete    │
│ ██████████████████████░░░░  75%                         │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [✓] 💧 Drink water    🔥12  [Personal]  [···]      │ │
│ │ [✓] 📖 Read           🔥 5  [Learning]  [···]      │ │
│ │ [ ] 🏃 Morning run    🔥31  [Health]    [···]      │ │
│ │ [ ] 🧘 Meditate       🔥 0  [Mental]    [···]      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ HABIT STATS (expandable)                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Completion rate (30d)   ████████████░░░  82%        │ │
│ │ Best streak             🔥 31 days                  │ │
│ │ Total completions       247                         │ │
│ └─────────────────────────────────────────────────────┘ │
│ [Load more ↓]                                           │
└─────────────────────────────────────────────────────────┘

NEW HABIT SHEET (right slide-over on desktop, bottom sheet on mobile)
┌──────────────────────────────────┐
│ New Habit                   [×]  │
│                                  │
│ Name *                           │
│ [____________________________]   │
│                                  │
│ Description                      │
│ [____________________________]   │
│                                  │
│ Icon    Color    Category        │
│ [😀]   [████]   [Health    ▼]   │
│                                  │
│ Frequency                        │
│ ( ) Daily  ( ) Weekly  ( ) Custom│
│                                  │
│ Target (optional)                │
│ [___] glasses / [unit____]       │
│                                  │
│ Reminder                         │
│ [08:00 AM]  [─────────────]      │
│                                  │
│ [Cancel]              [Create →] │
└──────────────────────────────────┘
```
**Components:** `HabitCard`, `Progress`, `Sheet`, `Form`, `Input`, `Select`, `Button`, `Badge`, `EmptyState`  
**API:** `GET /habits/today`, `GET /habits`, `POST /habits`, `POST /habits/:id/logs`

---

## 3. RECOVERY  `/app/recovery`

```
┌─────────────────────────────────────────────────────────┐
│ Recovery Goals                    [+ New Goal]          │
├─────────────────────────────────────────────────────────┤
│ ACTIVE GOALS                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  🛡️ Alcohol-free                        [···]      │ │
│ │                                                     │ │
│ │  ┌────────┐  47 days sober                         │ │
│ │  │  Ring  │  Started: May 13, 2026                 │ │
│ │  │  47d   │  Best streak: 47 days (current)        │ │
│ │  └────────┘                                        │ │
│ │                                                     │ │
│ │  0:14:32:09  ← live sobriety clock                 │ │
│ │  hrs  min  sec                                      │ │
│ │                                                     │ │
│ │  [🚨 Log Relapse]          [Milestones]            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ MILESTONES                                              │
│ ✅ 1 day    ✅ 7 days   ✅ 30 days   ○ 60 days         │
│ ─────────────────────────────────────────────────────   │
│ ○ 90 days  ○ 6 months  ○ 1 year                        │
├─────────────────────────────────────────────────────────┤
│ RELAPSE HISTORY              [All (3)]                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Jun 1 — Streak reset from 15d  Trigger: stress      │ │
│ │ Apr 8 — Streak reset from 8d   Trigger: social      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

LOG RELAPSE DIALOG
┌──────────────────────────────────┐
│ ⚠️ Log a Relapse                 │
│                                  │
│ This will reset your streak.     │
│                                  │
│ What triggered it?               │
│ [Stress / Emotion          ▼]    │
│                                  │
│ Reflection (optional)            │
│ [______________________________] │
│                                  │
│ [Cancel]       [Log & Reset →]   │
└──────────────────────────────────┘
```
**Components:** `StreakRing`, `Card`, `Badge`, `Dialog`, `Form`, `Select`, `Textarea`, `Button`, `EmptyState`  
**API:** `GET /recovery`, `POST /recovery`, `POST /recovery/:id/relapse`, `GET /recovery/:id/history`

---

## 4. JOURNAL  `/app/journal`

```
┌─────────────────────────────────────────────────────────┐
│ Journal                              [← Jul] Jun [→]   │
├─────────────────────────────────────────────────────────┤
│ TODAY — Sunday, 29 June 2026                            │
│                                                         │
│ ┌──── MORNING ────────────────────────────────────────┐ │
│ │ 🌅  How do you feel this morning?                   │ │
│ │                                                     │ │
│ │  Mood: [😊 Good ▼]   Energy: [⚡⚡⚡○○]             │ │
│ │                                                     │ │
│ │  Gratitude (3 things)                               │ │
│ │  1. [_______________________________________]       │ │
│ │  2. [_______________________________________]       │ │
│ │  3. [_______________________________________]       │ │
│ │                                                     │ │
│ │  Intention for today                                │ │
│ │  [___________________________________________]      │ │
│ │                                   [Save draft] [✓] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌──── EVENING ────────────────────────────────────────┐ │
│ │ 🌙  Locked until 5 PM                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌──── FREE WRITE ─────────────────────────────────────┐ │
│ │ [+ New free write entry]                            │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ PAST ENTRIES                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Sat 28 Jun  🌅 Morning  🌙 Evening               →│  │
│ │ Fri 27 Jun  🌅 Morning                            →│  │
│ │ Thu 26 Jun  🌅 Morning  🌙 Evening  ✍️ Free      →│  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Card`, `Textarea`, `Select`, `Button`, `Slider`, `Badge`, `EmptyState`  
**API:** `GET /journal/date/:date`, `POST /journal`, `PATCH /journal/:id`

---

## 5. NOTES  `/app/notes`

```
Desktop: 3-panel layout
┌──────────────────────────────────────────────────────────┐
│ FOLDERS (200px)  │ LIST (280px)     │ EDITOR (flex)     │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌───────────────┐ │
│ │ [+ Folder]   │ │ │ [+ New Note] │ │ │ <Title>       │ │
│ │              │ │ │ 🔍 Search    │ │ │               │ │
│ │ 📁 All notes │ │ │──────────────│ │ │ [Tag1][Tag2]  │ │
│ │ 📁 Personal  │ │ │ Note title   │ │ │               │ │
│ │ 📁 Work      │ │ │ Jun 28 · 2m  │ │ │ Content area  │ │
│ │  └ 📁 Ideas  │ │ │ Preview…     │ │ │ (rich text)   │ │
│ │ 📁 Learning  │ │ │──────────────│ │ │               │ │
│ │              │ │ │ Note title   │ │ │               │ │
│ │ TAGS         │ │ │ ···          │ │ │               │ │
│ │ [tag1][tag2] │ │ │              │ │ │ ATTACHMENTS   │ │
│ └──────────────┘ │ └──────────────┘ │ │ [📎 Add file] │ │
│                  │                  │ └───────────────┘ │
└──────────────────────────────────────────────────────────┘

Mobile: full-screen panels, back button navigates between them
```
**Components:** `ScrollArea`, `Input`, `Badge`, `Sheet`, `Button`, `EmptyState`, `Separator`  
**API:** `GET /notes/folders`, `GET /notes`, `POST /notes`, `PATCH /notes/:id`, `GET /notes/tags`

---

## 6. GYM  `/app/gym`

```
┌─────────────────────────────────────────────────────────┐
│ Gym                                                     │
│ [Today] [History] [Templates] [Exercises] [PRs]        │
├─────────────────────────────────────────────────────────┤
│ TODAY tab                                               │
│                                                         │
│ ┌─ ACTIVE WORKOUT ─────────────────────────────────────┐ │
│ │ 🏋️ Upper Body Push          ⏱ 0:24:11               │ │
│ │                                                     │ │
│ │ Bench Press                 [ + Add set ]           │ │
│ │ Set 1:  60kg × 10   [ ✓ ]                          │ │
│ │ Set 2:  65kg × 8    [ ✓ ]                          │ │
│ │ Set 3:  65kg × _    [ ]                             │ │
│ │                                                     │ │
│ │ Overhead Press                                      │ │
│ │ Set 1:  40kg × 10   [ ✓ ]                          │ │
│ │                                                     │ │
│ │ [ + Add exercise ]                                  │ │
│ │                                                     │ │
│ │ [Discard]              [Finish Workout ✓]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ No active workout?                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Start empty workout] or choose a template:         │ │
│ │                                                     │ │
│ │ [💪 Upper Push]  [🦵 Lower]  [🔙 Pull]  [Full]    │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ PERSONAL RECORDS                                        │
│ Bench: 80kg  Squat: 100kg  Deadlift: 130kg             │
└─────────────────────────────────────────────────────────┘

HISTORY tab
┌─────────────────────────────────────────────────────────┐
│ Jun 27  Upper Body Push  45min  Volume: 4200kg       →  │
│ Jun 25  Lower Body       52min  Volume: 6100kg       →  │
│ ···                                                     │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Card`, `Button`, `Badge`, `Tabs`, `Input`, `EmptyState`, `Skeleton`  
**API:** `GET /gym/sessions/active`, `POST /gym/sessions/start`, `POST /gym/sessions/:id/exercises/:exId/sets`, `POST /gym/sessions/:id/finish`, `GET /gym/prs`

---

## 7. GOALS  `/app/goals`

```
┌─────────────────────────────────────────────────────────┐
│ Goals                          [+ New Goal]  [Filter▼] │
│ [All] [Active] [Completed] [Paused]                     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎯 Run a 5K                           Q3 2026  [···]│ │
│ │                                                     │ │
│ │ Progress                                            │ │
│ │ ████████████████░░░░░░░░  3.2 / 5 km   64%         │ │
│ │                                                     │ │
│ │ MILESTONES                                          │ │
│ │ ✅ 1km  ✅ 2km  ✅ 3km  ○ 4km  ○ 5km               │ │
│ │                                                     │ │
│ │ Linked habits: [🏃 Morning run]                     │ │
│ │                                        [Update →]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📚 Read 24 books this year             Dec 2026 [···]│ │
│ │ ████████████░░░░░░░░░░░░  11 / 24      46%          │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Card`, `Progress`, `Badge`, `Button`, `Sheet`, `Form`, `EmptyState`  
**API:** `GET /goals`, `POST /goals`, `PATCH /goals/:id/progress`, `POST /goals/:id/milestones/:mId/complete`

---

## 8. PLANNER  `/app/planner`

```
┌─────────────────────────────────────────────────────────┐
│ Daily Planner          [← Sun 29] Mon 30 Jun [→]       │
│                                              [Carry →] │
├─────────────────────────────────────────────────────────┤
│ [+ Add task]                                            │
├─────────────────────────────────────────────────────────┤
│ MORNING                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [✓] ☀️ 08:00  Morning routine         HIGH [:::][✕]│ │
│ │ [ ]    09:00  Team standup            MED  [:::][✕]│ │
│ │ [ ]    10:00  Write design doc        HIGH [:::][✕]│ │
│ └─────────────────────────────────────────────────────┘ │
│ AFTERNOON                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [ ]    13:00  Lunch with Sarah        LOW  [:::][✕]│ │
│ │ [ ]    14:30  Code review             MED  [:::][✕]│ │
│ │ [ ] 🔁 16:00  Gym                     HIGH [:::][✕]│ │
│ └─────────────────────────────────────────────────────┘ │
│ EVENING                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [ ]    19:00  Read (30min)            MED  [:::][✕]│ │
│ └─────────────────────────────────────────────────────┘ │
│ [:::] = drag handle for reorder                         │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Checkbox`, `Badge`, `Button`, `Card`, `EmptyState`  
**API:** `GET /planner/:date`, `POST /planner`, `PATCH /planner/:id`, `DELETE /planner/:id`, `PATCH /planner/reorder`, `POST /planner/carry-over`

---

## 9. CALENDAR  `/app/calendar`

```
┌─────────────────────────────────────────────────────────┐
│ Calendar          [← May] June 2026 [→]   [Layers ▼]  │
│                                                         │
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat                       │
│  ─    ─    ─   1    2    3    4                         │
│            ·   ✅   💪   📓   ·                        │
│  5    6    7    8    9   10   11                        │
│  ·   ✅💪  ·   ✅   ·   ✅   ·                        │
│ 12   13   14   15   16   17   18                        │
│  ·   ✅   💪  ✅💪  ·   ✅   ·                        │
│ 19   20   21   22   23   24   25                        │
│  ·   ✅   ·   ✅💪  ·   ✅   ·                        │
│ 26   27   28  [29]  30                                  │
│  ·   ✅💪  ·  ✅💪  ·                                  │
│                 ↑ today (ring around date)               │
├─────────────────────────────────────────────────────────┤
│ JUNE 29 DETAIL                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✅ 6/8 habits complete                              │ │
│ │ 💪 Upper Push — 45min                              │ │
│ │ 📓 Morning journal written                         │ │
│ │ 🛡️ Day 47 sober                                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

LAYERS toggle (Popover)
[✓] Habits  [✓] Gym  [✓] Journal  [✓] Recovery  [ ] Goals  [ ] Mood
```
**Components:** `Popover`, `Badge`, `Card`, `Checkbox`, `Button`  
**API:** `GET /calendar/:year/:month?layers=...`, `GET /calendar/day/:date`

---

## 10. ANALYTICS  `/app/analytics`

```
┌─────────────────────────────────────────────────────────┐
│ Analytics                                               │
│ [Week] [Month] [3 Months] [Year]  From [──] To [──]   │
│                                                         │
│ [Habits] [Recovery] [Fitness] [Mood] [Goals]  ← Tabs  │
├─────────────────────────────────────────────────────────┤
│ HABITS tab                                              │
│                                                         │
│ OVERVIEW CARDS (2-col)                                  │
│ ┌──────────────┐  ┌──────────────┐                     │
│ │ Completion   │  │ Best Streak  │                     │
│ │ 82%  ↑ +4%  │  │ 🔥 31 days  │                     │
│ └──────────────┘  └──────────────┘                     │
│                                                         │
│ COMPLETION OVER TIME (Bar chart - Recharts)             │
│ 100%│                                                   │
│  80%│  ██  ██  ██  ██  ██  ██  ██                      │
│  60%│  ██  ██  ██  ██  ██  ██  ██                      │
│  40%│                                                   │
│     └─────────────────────────────                      │
│      Mon Tue Wed Thu Fri Sat Sun                        │
│                                                         │
│ HABIT BREAKDOWN (stacked bar or heatmap)                │
│ 💧 Drink water   ████████████████████  95%             │
│ 📖 Read          ████████████████░░░░  78%             │
│ 🏃 Run           ██████████████░░░░░░  68%             │
│ 🧘 Meditate      ████████░░░░░░░░░░░░  40%             │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Tabs`, `StatCard`, `Progress`, `Card`, `Select`, `Recharts(BarChart)`  
**API:** `GET /analytics/overview`, `GET /analytics/habits`, `GET /analytics/fitness`, `GET /analytics/mood`

---

## 11. LIFE BALANCE  `/app/life-balance`

```
┌─────────────────────────────────────────────────────────┐
│ Life Balance                        Score: 74/100       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              RADAR CHART (Recharts)                     │
│                    Health                               │
│                  ●────────●                             │
│           MH ●─────────────────● Fitness               │
│               │   ██████████   │                        │
│  Self Care ●──┼──████████████──┼── Career               │
│               │   ██████████   │                        │
│     Learning ●─────────────────● Finance                │
│                  ●────────●                             │
│                 Relationships                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ DIMENSION BREAKDOWN                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏃 Health (18%)        ████████████████░░  88/100   │ │
│ │ 💪 Fitness (15%)       ████████████░░░░░░  70/100   │ │
│ │ 💼 Career (12%)        ██████████████░░░░  78/100   │ │
│ │ 💰 Finance (10%)       ████████░░░░░░░░░░  52/100   │ │
│ │ ❤️ Relationships (12%) ████████████████░░  84/100   │ │
│ │ 📚 Learning (12%)      ██████████████░░░░  76/100   │ │
│ │ 🧠 Mental Health (13%) ████████████░░░░░░  68/100   │ │
│ │ 🌿 Self Care (8%)      ██████████████████  92/100   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ HISTORY (last 12 weeks)                                 │
│ Score 100│          ╭─────╮                             │
│       80 │   ╭──────╯     ╰──╮                          │
│       60 │───╯               ╰────                      │
│          └─────────────────────────                      │
│           Apr    May    Jun                              │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Card`, `Progress`, `Badge`, `Recharts(RadarChart, LineChart)`, `StatCard`  
**API:** `GET /life-balance/current`, `GET /life-balance/history?weeks=12`

---

## 12. ACHIEVEMENTS  `/app/achievements`

```
┌─────────────────────────────────────────────────────────┐
│ Achievements                                            │
├─────────────────────────────────────────────────────────┤
│ LEVEL & XP                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  ⭐ Level 12 — Habit Warrior                        │ │
│ │  XP: 2,840 / 3,500                                  │ │
│ │  ████████████████████░░░░░░░░░  81%                 │ │
│ │  660 XP to Level 13                                 │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ RECENT BADGES                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔥 30-Day Streak  ✅ Week 1  📓 Journaler  💪 Iron  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ALL BADGES                         [Earned] [Locked]   │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │  🔥  │ │  📖  │ │  💪  │ │  🛡️ │ │  🌅  │          │
│ │30day │ │Reader│ │ Iron │ │Sober │ │Early │          │
│ │✅ Earned│ │✅   │ │locked│ │✅   │ │locked│          │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Card`, `Progress`, `Badge`, `Tabs`, `Tooltip`, `EmptyState`, `Avatar`  
**API:** `GET /achievements/level`, `GET /achievements/badges`, `GET /achievements/my-badges`

---

## 13. SEARCH  `/app/search`

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Search everything…                               ]  │
│                                                         │
│ Filter: [All ▼]  [Habits] [Notes] [Journal] [Goals]    │
├─────────────────────────────────────────────────────────┤
│ RESULTS for "meditation"                  12 results    │
│                                                         │
│ HABITS (2)                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🧘 Meditate            🔥 0d   [Personal]         →│ │
│ │ 🌬️ Breathing exercise  🔥 3d   [Mental]           →│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ NOTES (4)                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📝 Meditation techniques          Work · Jun 15   →│ │
│ │ 📝 Morning routine notes          Personal · May…  →│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ JOURNAL ENTRIES (6)                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📓 Jun 20 · Morning — "started meditation at…"    →│ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Input`, `Badge`, `Card`, `EmptyState`, `Skeleton`  
**API:** `GET /search?q=...&types=...`

---

## 14. SETTINGS  `/app/settings`

```
┌─────────────────────────────────────────────────────────┐
│ Settings                                                │
│ [Profile] [Preferences] [Notifications] [Privacy]      │
├─────────────────────────────────────────────────────────┤
│ PROFILE tab                                             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ AVATAR                                              │ │
│ │ ┌─────┐                                            │ │
│ │ │ RJ  │  [Upload photo]  [Remove]                  │ │
│ │ └─────┘                                            │ │
│ │                                                     │ │
│ │ First name    Last name                             │ │
│ │ [__________]  [__________]                          │ │
│ │                                                     │ │
│ │ Username                                            │ │
│ │ [@___________]                                      │ │
│ │                                                     │ │
│ │ Bio                                                 │ │
│ │ [_________________________________________]         │ │
│ │                                                     │ │
│ │ Timezone        Language                            │ │
│ │ [UTC+5:30   ▼]  [English        ▼]                 │ │
│ │                                                     │ │
│ │                              [Save changes]         │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ DANGER ZONE                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Export my data]    [Delete account]                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```
**Components:** `Tabs`, `Form`, `Input`, `Textarea`, `Select`, `Switch`, `Avatar`, `Button`, `Separator`, `Alert`  
**API:** `GET /users/me`, `PATCH /users/me`, `POST /users/me/avatar`, `GET /users/me/settings`, `PATCH /users/me/settings`

---

## 15. ADMIN PANEL  `/admin`

```
┌─────────────────────────────────────────────────────────┐
│ [Habito Admin]        [Dashboard] [Users] [Audit] [Flags]│
├─────────────────────────────────────────────────────────┤
│ DASHBOARD                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Total    │ │ Active   │ │ New this │ │ DAU      │   │
│ │ 1,248    │ │ 892      │ │ week: 34 │ │ 412      │   │
│ │ users    │ │ users    │ │          │ │          │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ USERS TABLE                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [🔍 Search]  [Role ▼]  [Status ▼]      [Export]    │ │
│ │─────────────────────────────────────────────────────│ │
│ │ # │ Name        │ Email          │ Role  │ Status   │ │
│ │ 1 │ Raj Gupta   │ raj@…          │ admin │ active   │ │
│ │ 2 │ Jane Doe    │ jane@…         │ user  │ active   │ │
│ │ ··· (paginated, offset)                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ USER DETAIL (click row → drawer)                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Jane Doe   jane@email.com   Joined: Apr 1           │ │
│ │ [Disable] [Impersonate] [Delete]                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```
**Components:** `StatCard`, `Sheet`, `Button`, `Badge`, `Select`, `Input`, `Dialog`, `Alert`, `Separator`  
**API:** `GET /admin/dashboard`, `GET /admin/users`, `POST /admin/users/:id/disable`, `POST /admin/users/:id/impersonate`

---

## AUTH SCREENS

```
LOGIN  /login
┌─────────────────────────────────────────────────────────┐
│ LEFT PANEL (lg: 50%)        │ RIGHT PANEL (form)         │
│                             │                            │
│ habito                      │  Welcome back              │
│ Your Personal OS            │  Sign in to your account   │
│                             │                            │
│ ✅ Habit Tracking           │  Email                     │
│ 🛡️ Recovery Support         │  [________________________]│
│ 💪 Gym Logging              │                            │
│ 📓 Daily Journal            │  Password        Forgot?   │
│                             │  [________________________]│
│                             │  [👁]                      │
│ © 2026 Habito               │                            │
│                             │  [ ] Remember me 30 days  │
│                             │                            │
│                             │  [       Sign in       →]  │
│                             │                            │
│                             │  No account? Create one    │
└─────────────────────────────────────────────────────────┘

REGISTER  /register
Same split layout. Form fields:
  First name / Last name (2-col)
  Username
  Email
  Password (with strength meter)
  [ ] I agree to Terms
  [Create account →]

FORGOT PASSWORD  /forgot-password
  Email
  [Send reset link →]
  Already have a link? Reset it here

RESET PASSWORD  /reset-password/[token]
  New password (+ strength meter)
  Confirm password
  [Set new password →]
```
**Components:** `Form`, `Input`, `Button`, `Alert`, `Checkbox`  
**API:** `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`

---

## INTERACTION PATTERNS

### Optimistic Updates
- Habit check/uncheck updates UI immediately; reverts on error with toast
- Task complete/incomplete updates UI immediately

### Loading States
- Page-level: `SkeletonList` or `SkeletonCard` grid, never full-page spinner
- Button-level: `loading` prop shows `<Loader2 animate-spin>`
- Infinite scroll: spinner at bottom while `isFetchingNextPage`

### Empty States
- First-time empty: illustration + CTA to create first item
- Search empty: "No results for X" with suggestions
- Filtered empty: "No items matching filter" + [Clear filters]

### Error States
- Network error: toast + retry button inline
- 404 (item deleted): toast + navigate back
- 403: toast "You don't have permission to do that"

### Responsive Breakpoints
```
sm   640px   Mobile-first single column
md   768px   Sidebar appears, 2-col grids
lg  1024px   3-col grids, note editor 3-panel
xl  1280px   4-col stat card grid
```

### Mobile-specific patterns
- Sheets open from bottom (not right) on <md
- Long-press on habit card opens context menu
- Swipe left on list item reveals delete button
- Pull-to-refresh on all list pages (`usePwa` background sync)
