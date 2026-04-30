import { useEffect } from 'react';
import { walkingPlan } from '../data/plan.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateFull(isoStr) {
  if (!isoStr) return '—';
  const [y, m, d] = isoStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[utc.getUTCDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

function formatDuration(minutes) {
  if (minutes == null) return null;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function WalkDetailModal({ log, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!log) return null;

  const planned = log.date ? (walkingPlan[log.date]?.miles ?? null) : null;
  const diff =
    planned != null && log.distanceMiles != null
      ? +(log.distanceMiles - planned).toFixed(2)
      : null;
  const beat = diff != null && diff >= 0;

  const statTiles = [
    log.durationMinutes != null && { label: 'Duration', value: formatDuration(log.durationMinutes), unit: null },
    log.averagePaceMinPerMile && { label: 'Avg Pace', value: log.averagePaceMinPerMile, unit: '/mi' },
    log.heartRate != null && { label: 'Avg Heart Rate', value: log.heartRate, unit: 'bpm' },
    log.activeCalories != null && { label: 'Active Calories', value: log.activeCalories, unit: 'cal' },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-cream rounded-t-3xl sm:rounded-3xl px-7 pt-7 pb-10 w-full sm:max-w-sm mx-auto z-10 ink-shadow-lg animate-fade-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-ink/30 hover:text-ink/60 transition-colors rounded-full hover:bg-ink/5"
          aria-label="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Date */}
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-5">
          {formatDateFull(log.date)}
        </p>

        {/* Distance hero */}
        <div className="flex items-baseline gap-2 mb-1">
          {log.distanceMiles != null ? (
            <>
              <span className={`font-display text-7xl font-light leading-none ${beat ? 'text-sage-700' : 'text-ink'}`}>
                {log.distanceMiles}
              </span>
              <span className={`font-display text-3xl italic ${beat ? 'text-sage-600' : 'text-ink/55'}`}>mi</span>
            </>
          ) : (
            <span className="font-display italic text-ink/35 text-3xl">No distance</span>
          )}
        </div>

        {/* Plan comparison */}
        {planned != null && (
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-xs text-ink/40">{planned} mi planned</span>
            {diff != null && (
              <span className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${beat ? 'bg-sage-100 text-sage-700' : 'bg-rose-50 text-rose-500'}`}>
                {beat ? `+${diff}` : diff} mi
              </span>
            )}
          </div>
        )}

        {/* Stat tiles */}
        {statTiles.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {statTiles.map(({ label, value, unit }) => (
              <div key={label} className="bg-ink/[0.04] rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-ink/40 mb-1.5">{label}</p>
                <p className="font-display text-xl text-ink leading-none">
                  {value}
                  {unit && <span className="text-ink/40 text-sm ml-1">{unit}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
