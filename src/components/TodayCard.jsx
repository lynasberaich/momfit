import { walkingPlan, isoDate } from '../data/plan.js';

function formatDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TodayCard({ selectedDate, walkLog, onLogClick }) {
  const key = isoDate(selectedDate);
  const entry = walkingPlan[key];

  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const longDate = selectedDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  // Logged stats block — shown whenever there's a log entry for this day
  const loggedBlock = walkLog ? (
    <button
      onClick={() => onLogClick?.(walkLog)}
      className="w-full text-left mt-6 group"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-sage-500" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-sage-600">
          Logged · tap for details
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-baseline gap-1.5 bg-sage-50 border border-sage-200 rounded-2xl px-4 py-2.5 group-hover:bg-sage-100 transition-colors">
          <span className="font-display text-3xl font-light text-sage-700 leading-none">
            {walkLog.distanceMiles?.toFixed(1) ?? '—'}
          </span>
          <span className="font-display italic text-sage-600 text-sm">mi actual</span>
        </div>
        {walkLog.durationMinutes && (
          <div className="flex flex-col justify-center bg-ink/5 border border-ink/10 rounded-2xl px-4 py-2.5">
            <span className="font-mono text-xs text-ink/40 uppercase tracking-widest leading-none mb-0.5">Duration</span>
            <span className="font-display text-lg text-ink/80">{formatDuration(walkLog.durationMinutes)}</span>
          </div>
        )}
        {walkLog.averagePaceMinPerMile && (
          <div className="flex flex-col justify-center bg-ink/5 border border-ink/10 rounded-2xl px-4 py-2.5">
            <span className="font-mono text-xs text-ink/40 uppercase tracking-widest leading-none mb-0.5">Pace</span>
            <span className="font-display text-lg text-ink/80">{walkLog.averagePaceMinPerMile}/mi</span>
          </div>
        )}
        {walkLog.heartRate && (
          <div className="flex flex-col justify-center bg-ink/5 border border-ink/10 rounded-2xl px-4 py-2.5">
            <span className="font-mono text-xs text-ink/40 uppercase tracking-widest leading-none mb-0.5">HR</span>
            <span className="font-display text-lg text-ink/80">{walkLog.heartRate} <span className="text-sm text-ink/40">bpm</span></span>
          </div>
        )}
        {walkLog.activeCalories && (
          <div className="flex flex-col justify-center bg-ink/5 border border-ink/10 rounded-2xl px-4 py-2.5">
            <span className="font-mono text-xs text-ink/40 uppercase tracking-widest leading-none mb-0.5">Cal</span>
            <span className="font-display text-lg text-ink/80">{walkLog.activeCalories}</span>
          </div>
        )}
      </div>
    </button>
  ) : null;

  // Plan body
  let body;
  if (!entry) {
    body = (
      <div className="space-y-3">
        <p className="font-display text-4xl md:text-5xl text-ink/80 italic">
          A free day.
        </p>
        <p className="text-ink/60 max-w-md">
          Nothing scheduled — the plan runs May 3 → June 30, 2026.
          Use the calendar below to peek at any day.
        </p>
        {loggedBlock}
      </div>
    );
  } else if (entry.rest) {
    body = (
      <div className="space-y-3">
        <p className="font-display text-5xl md:text-7xl italic text-rose-400">
          Rest day.
        </p>
        <p className="text-ink/60 max-w-md text-lg">
          Recovery is part of the plan. Stretch, hydrate,
          do whatever feels good.
        </p>
        {loggedBlock}
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        {/* Planned distance */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/40 mb-1">Goal</p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-7xl md:text-9xl font-light text-sage-700 leading-none">
              {entry.miles}
            </span>
            <span className="font-display text-3xl md:text-4xl italic text-sage-600">
              {entry.miles === 1 ? 'mile' : 'miles'}
            </span>
          </div>
        </div>
        {entry.intervals && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-butter/60 border border-ink/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-mono text-sm tracking-wide text-ink/80">
              intervals · {entry.intervals}
            </span>
          </div>
        )}
        {!walkLog && (
          <p className="text-ink/60 max-w-md">
            Lace up. Take it at a pace that feels good.
          </p>
        )}
        {loggedBlock}
      </div>
    );
  }

  return (
    <section className="relative animate-fade-up">
      <div className="relative bg-cream border border-ink/10 rounded-3xl p-8 md:p-12 ink-shadow-lg overflow-hidden">
        {/* Decorative grid paper background */}
        <div className="absolute inset-0 grid-paper opacity-60 pointer-events-none" />

        {/* Decorative SVG squiggle */}
        <svg
          className="absolute -top-6 -right-6 w-40 h-40 text-sage-200 pointer-events-none"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M10 50 Q 25 20, 50 50 T 90 50"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10 70 Q 25 40, 50 70 T 90 70"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/50">
              {key === isoDate(new Date()) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <span className="h-px flex-1 bg-ink/15" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/50">
              {longDate}
            </span>
          </div>

          <p className="font-display text-2xl md:text-3xl italic text-ink/70 mb-6">
            Hi, Meryem. It's <span className="text-sage-700 not-italic font-medium">{dayName}</span>.
          </p>

          {body}
        </div>
      </div>
    </section>
  );
}
