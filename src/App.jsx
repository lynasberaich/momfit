import { useState, useEffect } from 'react';
import TodayCard from './components/TodayCard.jsx';
import CalendarMonth from './components/CalendarMonth.jsx';
import LiftCard from './components/LiftCard.jsx';
import WeeklySummary from './components/WeeklySummary.jsx';
import LogWalk from './components/LogWalk.jsx';
import WalkDetailModal from './components/WalkDetailModal.jsx';
import { liftingPlan, isoDate } from './data/plan.js';
import { getWalkLogs } from './data/walkLogs.js';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [walkLogs, setWalkLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logRefresh, setLogRefresh] = useState(0);

  useEffect(() => {
    getWalkLogs()
      .then(setWalkLogs)
      .catch(console.error);
  }, [logRefresh]);

  // Build O(1) lookup: { 'YYYY-MM-DD': logEntry }
  const walkLogsByDate = {};
  walkLogs.forEach((l) => { if (l.date) walkLogsByDate[l.date] = l; });

  function handleLogSaved() {
    setLogRefresh((r) => r + 1);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50 mb-3">
              The Plan · May–June 2026
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-light text-ink leading-[0.95] tracking-tight">
              Walk. Lift.
              <br />
              <span className="italic text-sage-600">Repeat.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LogWalk onSaved={handleLogSaved} />
            <div className="hidden md:block">
              <svg width="120" height="60" viewBox="0 0 120 60" fill="none" className="text-rose-300">
                <path d="M5 30 Q 30 5, 60 30 T 110 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M100 22 L110 30 L100 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-10">
        {/* Today's walk - hero */}
        <TodayCard
          selectedDate={selectedDate}
          walkLog={walkLogsByDate[isoDate(selectedDate)]}
          onLogClick={setSelectedLog}
        />

        {/* Weekly summary — now shows actual vs planned */}
        <WeeklySummary
          selectedDate={selectedDate}
          walkLogsByDate={walkLogsByDate}
          onLogClick={setSelectedLog}
          onDateChange={setSelectedDate}
        />

        {/* Calendars: May & June */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-display text-3xl text-ink">The Walking Plan</h2>
            <span className="h-px flex-1 bg-ink/15" />
            <span className="font-mono text-xs uppercase tracking-widest text-ink/50">
              Tap any day
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-5 mb-5 text-xs">
            <span className="flex items-center gap-2 text-ink/60">
              <span className="w-3 h-3 rounded bg-sage-200 border border-sage-300" />
              Logged
            </span>
            <span className="flex items-center gap-2 text-ink/60">
              <span className="w-3 h-3 rounded bg-sage-50 border border-sage-200" />
              Walk day
            </span>
            <span className="flex items-center gap-2 text-ink/60">
              <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200" />
              Rest day
            </span>
            <span className="flex items-center gap-2 text-ink/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
              Has intervals
            </span>
            <span className="flex items-center gap-2 text-ink/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Today
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <CalendarMonth
              year={2026}
              month={4}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              label="Month 1"
              walkLogsByDate={walkLogsByDate}
              onLogClick={setSelectedLog}
            />
            <CalendarMonth
              year={2026}
              month={5}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              label="Month 2"
              walkLogsByDate={walkLogsByDate}
              onLogClick={setSelectedLog}
            />
          </div>
        </section>

        {/* Lifts */}
        <section>
          <div className="flex items-baseline gap-3 mb-2">
            <h2 className="font-display text-3xl text-ink">The Lifts</h2>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <p className="text-ink/60 mb-6 italic font-display text-lg">
            Two lifts per week, whenever possible.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <LiftCard lift={liftingPlan.liftOne} number="1" />
            <LiftCard lift={liftingPlan.liftTwo} number="2" />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 pb-4">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-ink/10" />
            <p className="font-display italic text-ink/40 text-sm">
              Made with love · You've got this, Meryem
            </p>
            <span className="h-px flex-1 bg-ink/10" />
          </div>
        </footer>
      </main>

      {/* Walk detail modal */}
      {selectedLog && (
        <WalkDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
