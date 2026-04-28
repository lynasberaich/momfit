import { useState, useEffect } from 'react';
import { getWalkLogs, deleteWalkLog } from '../data/walkLogs.js';
import { walkingPlan } from '../data/plan.js';

function formatDuration(minutes) {
  if (minutes == null) return null;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function parseLocalDate(isoStr) {
  return new Date(isoStr + 'T12:00:00');
}

export default function ActivityLog({ refresh }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const data = await getWalkLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [refresh]);

  async function handleDelete(id) {
    try {
      await deleteWalkLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-ink/40">
        <div className="w-4 h-4 border-2 border-ink/30 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
        <p className="font-mono text-xs text-rose-600 uppercase tracking-widest mb-1">Error loading logs</p>
        <p className="font-mono text-sm text-rose-500">{error}</p>
        <button
          onClick={reload}
          className="mt-3 font-mono text-xs uppercase tracking-widest text-rose-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-ink/15 rounded-2xl">
        <p className="font-display italic text-ink/35 text-2xl mb-2">No walks logged yet.</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/30">
          Use "Log a Walk" above to get started
        </p>
      </div>
    );
  }

  const totalLogged = logs.reduce((s, l) => s + (l.distanceMiles ?? 0), 0);
  const logsWithPlan = logs.filter((l) => l.date && walkingPlan[l.date]?.miles != null);
  const totalPlanned = logsWithPlan.reduce((s, l) => s + (walkingPlan[l.date]?.miles ?? 0), 0);
  const pct = totalPlanned > 0 ? Math.round((totalLogged / totalPlanned) * 100) : null;

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-cream border border-ink/10 rounded-2xl p-5 ink-shadow">
          <p className="font-display text-4xl font-light leading-none">
            {totalLogged.toFixed(1)}
            <span className="text-xl text-ink/45 italic ml-1.5">mi</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink/45 mt-2">
            Miles walked
          </p>
        </div>
        <div className="bg-cream border border-ink/10 rounded-2xl p-5 ink-shadow">
          <p className="font-display text-4xl font-light leading-none">
            {logs.length}
            <span className="text-xl text-ink/45 italic ml-1.5">
              {logs.length === 1 ? 'walk' : 'walks'}
            </span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink/45 mt-2">
            Logged
          </p>
        </div>
        {pct != null && (
          <div className="col-span-2 sm:col-span-1 bg-cream border border-ink/10 rounded-2xl p-5 ink-shadow">
            <p className={`font-display text-4xl font-light leading-none ${pct >= 100 ? 'text-sage-700' : 'text-ink'}`}>
              {pct}
              <span className={`text-xl italic ml-1 ${pct >= 100 ? 'text-sage-600' : 'text-ink/45'}`}>%</span>
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/45 mt-2">
              Of plan
            </p>
          </div>
        )}
      </div>

      {/* Walk entries */}
      <div className="space-y-3">
        {logs.map((log) => {
          const planned = log.date ? (walkingPlan[log.date]?.miles ?? null) : null;
          const diff =
            planned != null && log.distanceMiles != null
              ? +(log.distanceMiles - planned).toFixed(2)
              : null;

          const dateLabel = log.date
            ? parseLocalDate(log.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
            : 'Unknown date';

          return (
            <div
              key={log.id}
              className="bg-cream border border-ink/10 rounded-2xl px-5 py-4 ink-shadow flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                {/* Date + diff badge */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                    {dateLabel}
                  </span>
                  {diff != null && (
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        diff >= 0
                          ? 'bg-sage-100 text-sage-700'
                          : 'bg-rose-50 text-rose-500'
                      }`}
                    >
                      {diff >= 0 ? `+${diff}` : diff} vs plan
                    </span>
                  )}
                </div>

                {/* Distance */}
                <div className="flex items-baseline gap-2 mb-1.5">
                  {log.distanceMiles != null ? (
                    <>
                      <span className="font-display text-3xl font-light text-ink leading-none">
                        {log.distanceMiles}
                      </span>
                      <span className="font-display italic text-ink/55 text-lg">mi</span>
                    </>
                  ) : (
                    <span className="font-display italic text-ink/35 text-lg">No distance</span>
                  )}
                  {planned != null && (
                    <span className="font-mono text-xs text-ink/35 ml-0.5">
                      / {planned} planned
                    </span>
                  )}
                </div>

                {/* Secondary stats */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {log.durationMinutes != null && (
                    <span className="font-mono text-xs text-ink/45">
                      {formatDuration(log.durationMinutes)} duration
                    </span>
                  )}
                  {log.averagePaceMinPerMile && (
                    <span className="font-mono text-xs text-ink/45">
                      {log.averagePaceMinPerMile}/mi pace
                    </span>
                  )}
                  {log.steps != null && (
                    <span className="font-mono text-xs text-ink/45">
                      {log.steps.toLocaleString()} steps
                    </span>
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(log.id)}
                className="shrink-0 p-1.5 text-ink/20 hover:text-rose-400 hover:bg-rose-50 transition-colors rounded-lg"
                aria-label="Delete walk log"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2.5 4.5h11M5.5 4.5V3a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1.5M6.5 7.5v4M9.5 7.5v4M3.5 4.5l.8 8a.5.5 0 0 0 .5.5h6.4a.5.5 0 0 0 .5-.5l.8-8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
