# Mom's Workout Plan 🌿

A warm, hand-drawn-feeling React app that delivers your mom's walking plan
day-by-day and tracks her two weekly lifts.

## What it does

- **Today's walk** — Big, beautiful headline number for what mom should walk today
  (or "Rest day" — also part of the plan!)
- **Weekly summary** — Total miles + walk-day count for the current week, with a
  mini week strip
- **Two-month calendar** — May and June 2026, exactly as in her hand-drawn plan.
  Tap any day to see its workout in the headline.
- **Two lift cards** — Lift #1 (legs) and Lift #2 (upper body), broken into
  dumbbell + machine sections. Tap any exercise to check it off.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

The built site goes in `dist/` — deploy it anywhere static (Netlify, Vercel,
GitHub Pages, etc.).

## Project structure

```
src/
├── App.jsx                      # Main layout
├── main.jsx                     # React entry point
├── index.css                    # Tailwind + globals
├── data/
│   └── plan.js                  # All walking + lifting data
└── components/
    ├── TodayCard.jsx            # Big "today" hero card
    ├── WeeklySummary.jsx        # Dark weekly stats card
    ├── CalendarMonth.jsx        # Reusable month calendar
    └── LiftCard.jsx             # One lift workout (with checkboxes)
```

## Editing the plan

All workout data lives in `src/data/plan.js`. The walking plan is keyed by
ISO date (`'YYYY-MM-DD'`). To change a day, edit that entry; to add a day past
June 30, just add a new key.
