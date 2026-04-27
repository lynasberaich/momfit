import { walkingPlan, isoDate } from '../data/plan.js';

export default function TodayCard({ selectedDate }) {
  const key = isoDate(selectedDate);
  const entry = walkingPlan[key];

  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const longDate = selectedDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  // States: rest day, walk day, off-plan day
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
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-7xl md:text-9xl font-light text-sage-700 leading-none">
            {entry.miles}
          </span>
          <span className="font-display text-3xl md:text-4xl italic text-sage-600">
            {entry.miles === 1 ? 'mile' : 'miles'}
          </span>
        </div>
        {entry.intervals && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-butter/60 border border-ink/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-mono text-sm tracking-wide text-ink/80">
              intervals · {entry.intervals}
            </span>
          </div>
        )}
        <p className="text-ink/60 max-w-md">
          Lace up. Take it at a pace that feels good.
        </p>
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
              Today
            </span>
            <span className="h-px flex-1 bg-ink/15" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/50">
              {longDate}
            </span>
          </div>

          <p className="font-display text-2xl md:text-3xl italic text-ink/70 mb-6">
            Hi, mom. It's <span className="text-sage-700 not-italic font-medium">{dayName}</span>.
          </p>

          {body}
        </div>
      </div>
    </section>
  );
}
