import { walkingPlan, isoDate } from '../data/plan.js';

export default function WeeklySummary({ selectedDate }) {
  // Find the Sunday of the week containing selectedDate
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - start.getDay());

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d);
  }

  const totalMiles = week.reduce((sum, d) => {
    const e = walkingPlan[isoDate(d)];
    return sum + (e?.miles || 0);
  }, 0);

  const walkDays = week.filter(d => walkingPlan[isoDate(d)]?.miles).length;

  return (
    <section className="bg-ink text-cream rounded-2xl p-7 ink-shadow-lg relative overflow-hidden">
      {/* Subtle decorative line drawing */}
      <svg
        className="absolute -bottom-4 -right-8 w-48 h-48 text-cream/[0.04] pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="relative">
        <div className="flex items-baseline justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">
            This Week
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' → '}
            {week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="font-display text-6xl font-light leading-none">
              {totalMiles}
              <span className="text-2xl text-cream/50 italic ml-2">mi</span>
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50 mt-2">
              Total Miles
            </p>
          </div>
          <div>
            <p className="font-display text-6xl font-light leading-none">
              {walkDays}
              <span className="text-2xl text-cream/50 italic ml-2">/ 7</span>
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50 mt-2">
              Walk Days
            </p>
          </div>
        </div>

        {/* Mini week strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const e = walkingPlan[isoDate(d)];
            const isSelected = isoDate(d) === isoDate(selectedDate);
            const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });

            let dotClass = 'w-full h-1 rounded-full ';
            if (e?.rest) dotClass += 'bg-rose-300';
            else if (e?.miles) dotClass += 'bg-sage-300';
            else dotClass += 'bg-cream/10';

            return (
              <div key={isoDate(d)} className="text-center">
                <p className={`font-mono text-[10px] mb-1.5 ${isSelected ? 'text-cream' : 'text-cream/40'}`}>
                  {dayLetter}
                </p>
                <div className={dotClass} />
                <p className="font-mono text-[9px] text-cream/40 mt-1.5 h-3">
                  {e?.miles ? `${e.miles}` : e?.rest ? '—' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
