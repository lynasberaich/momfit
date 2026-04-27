import { walkingPlan, isoDate } from '../data/plan.js';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarMonth({ year, month, selectedDate, onSelect, label }) {
  // month is 0-indexed (0 = January)
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = firstOfMonth.toLocaleDateString('en-US', { month: 'long' });
  const todayKey = isoDate(new Date());
  const selectedKey = isoDate(selectedDate);

  return (
    <div className="bg-cream border border-ink/10 rounded-2xl p-6 ink-shadow">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-1">
            {label}
          </p>
          <h3 className="font-display text-3xl text-ink">
            {monthName} <span className="text-ink/40 font-light">{year}</span>
          </h3>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d, i) => (
          <div
            key={i}
            className="text-center font-mono text-[10px] uppercase tracking-widest text-ink/40 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const date = new Date(year, month, day);
          const key = isoDate(date);
          const entry = walkingPlan[key];
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          let cellClass = 'aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-200 relative ';
          let labelClass = 'font-medium ';
          let mileClass = 'font-mono text-[9px] mt-0.5 ';

          if (isSelected) {
            cellClass += 'bg-ink text-cream ring-2 ring-ink ring-offset-2 ring-offset-cream scale-105 ';
            labelClass += '';
            mileClass += 'text-cream/70';
          } else if (entry?.rest) {
            cellClass += 'bg-rose-50 hover:bg-rose-100 text-rose-500 hover:scale-105 ';
            mileClass += 'text-rose-400';
          } else if (entry?.miles) {
            cellClass += 'bg-sage-50 hover:bg-sage-100 text-sage-800 hover:scale-105 ';
            mileClass += 'text-sage-600';
          } else {
            cellClass += 'text-ink/30 hover:bg-ink/5 ';
            mileClass += 'text-ink/30';
          }

          return (
            <button
              key={key}
              onClick={() => onSelect(date)}
              className={cellClass}
              aria-label={`${monthName} ${day}`}
            >
              <span className={labelClass}>{day}</span>
              {entry?.rest && <span className={mileClass}>rest</span>}
              {entry?.miles && (
                <span className={mileClass}>{entry.miles}mi</span>
              )}
              {isToday && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400" />
              )}
              {entry?.intervals && !isSelected && (
                <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-rose-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
