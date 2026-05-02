import { useState, useRef } from 'react';
import { walkingPlan, isoDate } from '../data/plan.js';

// ── Palette ───────────────────────────────────────────────────────────────────
const SAGE_400 = '#86A06F';
const ROSE_300 = '#DD9A8C';
const CREAM    = '#FAF6F0';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePace(str) {
  if (!str) return null;
  const [m, s = '0'] = str.split(':');
  return Number(m) + Number(s) / 60;
}
function formatPace(v) {
  if (v == null) return '—';
  const m = Math.floor(v);
  const s = Math.round((v - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function formatDateShort(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${DAYS[utc.getUTCDay()]}, ${MONTHS[m-1]} ${d}`;
}

// ── Metric config ─────────────────────────────────────────────────────────────

const METRICS = [
  {
    key: 'distance',
    label: 'Distance',
    color: '#86efac',
    getValue: (log) => log?.distanceMiles ?? null,
    display: (v) => `${v} mi`,
    short: (v) => String(v),
  },
  {
    key: 'pace',
    label: 'Pace',
    color: '#fca5a5',
    getValue: (log) => log?.averagePaceMinPerMile ? parsePace(log.averagePaceMinPerMile) : null,
    display: (v) => `${formatPace(v)}/mi`,
    short: (v) => formatPace(v),
  },
  {
    key: 'heartRate',
    label: 'Heart Rate',
    color: '#7dd3fc',
    getValue: (log) => log?.heartRate ?? null,
    display: (v) => `${v} bpm`,
    short: (v) => String(v),
  },
  {
    key: 'calories',
    label: 'Calories',
    color: '#fdba74',
    getValue: (log) => log?.activeCalories ?? null,
    display: (v) => `${v} cal`,
    short: (v) => String(v),
  },
];

// ── Chart utilities ───────────────────────────────────────────────────────────
// x: 7 positions aligned with a 7-column grid (7% padding each side)
function xAt(i) { return 7 + i * (86 / 6); }

const C_TOP = 4;
const C_H   = 42;
function yAt(norm, invert) {
  return C_TOP + (invert ? norm : 1 - norm) * C_H;
}

function buildPoints(week, walkLogsByDate, metric) {
  const raw = week.map((d, i) => {
    const key = isoDate(d);
    const log = walkLogsByDate?.[key];
    const value = metric.getValue(log);
    return { i, key, value };
  });
  const withData = raw.filter(p => p.value != null);
  if (!withData.length) return [];
  const vals = withData.map(p => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  return raw.map(p => ({ ...p, norm: p.value != null ? (p.value - min) / range : null, min, max }));
}

function buildPath(points, metric) {
  const parts = []; let open = false;
  points.forEach(p => {
    if (p.norm == null) { open = false; return; }
    parts.push(`${open ? 'L' : 'M'} ${xAt(p.i).toFixed(2)} ${yAt(p.norm, metric.invert).toFixed(2)}`);
    open = true;
  });
  return parts.join(' ');
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ week, walkLogsByDate, metric, onClose }) {
  const points = buildPoints(week, walkLogsByDate, metric);
  const withData = points.filter(p => p.norm != null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ink border border-cream/10 rounded-3xl p-6 w-full max-w-sm mx-auto z-10 ink-shadow-lg animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: metric.color }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">{metric.label}</span>
          </div>
          <button onClick={onClose} className="p-1 text-cream/30 hover:text-cream/60 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Y-axis + chart side by side */}
        {withData.length > 0 && (() => {
          const primaryMetric = metric;
          const pts = points;
          const max = pts.filter(p => p.norm != null)[0]?.max;
          const min = pts.filter(p => p.norm != null)[0]?.min;
          return (
            <div className="flex gap-1 mb-4" style={{ height: '120px' }}>
              {/* Y-axis */}
              <div className="w-10 shrink-0 flex flex-col justify-between py-0.5">
                <span className="font-mono text-[8px] text-right block pr-1" style={{ color: primaryMetric.color }}>
                  {primaryMetric.short(metric.invert ? min : max)}
                </span>
                <span className="font-mono text-[8px] text-right block pr-1" style={{ color: primaryMetric.color }}>
                  {primaryMetric.short(metric.invert ? max : min)}
                </span>
              </div>
              {/* Chart */}
              <div className="flex-1">
                <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                  {[0, 0.5, 1].map(v => (
                    <line key={v} x1="0" y1={yAt(v, false).toFixed(1)} x2="100" y2={yAt(v, false).toFixed(1)}
                      stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  ))}
                  {(() => { const d = buildPath(pts, primaryMetric); return d ? <path d={d} stroke={primaryMetric.color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null; })()}
                </svg>
              </div>
            </div>
          );
        })()}

        {/* Day labels row */}
        <div className="flex mb-3">
          <div className="w-10 shrink-0" />
          <div className="flex-1 grid grid-cols-7">
            {week.map((d, i) => (
              <p key={i} className="text-center font-mono text-[8px] text-cream/25 uppercase">
                {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </p>
            ))}
          </div>
        </div>

        {/* Value list */}
        <div className="space-y-2">
          {withData.map(p => (
            <div key={p.i} className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-cream/35">{formatDateShort(p.key)}</span>
              <span className="font-mono text-xs" style={{ color: metric.color }}>{metric.display(p.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeeklySummary({ selectedDate, walkLogsByDate, onLogClick }) {
  const [activeMetrics, setActiveMetrics] = useState({
    distance: true, pace: true, heartRate: true, calories: true,
  });
  const [detailMetric, setDetailMetric] = useState(null);
  const longPressRef = useRef(null);
  const didLongPress = useRef(false);

  const start = new Date(selectedDate);
  start.setDate(start.getDate() - start.getDay());
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });

  const totalPlanned = week.reduce((s, d) => s + (walkingPlan[isoDate(d)]?.miles || 0), 0);
  const totalLogged  = week.reduce((s, d) => s + (walkLogsByDate?.[isoDate(d)]?.distanceMiles || 0), 0);
  const walkDays   = week.filter(d => walkingPlan[isoDate(d)]?.miles).length;
  const loggedDays = week.filter(d => walkLogsByDate?.[isoDate(d)]).length;
  const hasLogs = loggedDays > 0;

  // Primary metric for y-axis: first active metric (null if all toggled off)
  const anyActive = METRICS.some(m => activeMetrics[m.key]);
  const primaryMetric = anyActive ? (METRICS.find(m => activeMetrics[m.key]) ?? METRICS[0]) : null;
  const primaryPoints = hasLogs && primaryMetric ? buildPoints(week, walkLogsByDate, primaryMetric) : [];
  const withData = primaryPoints.filter(p => p.norm != null);
  const yMax = withData[0]?.max;
  const yMin = withData[0]?.min;

  function startPress(key) {
    didLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      setDetailMetric(METRICS.find(m => m.key === key));
    }, 550);
  }
  function endPress() { clearTimeout(longPressRef.current); }
  function handlePillClick(key) {
    if (!didLongPress.current) setActiveMetrics(p => ({ ...p, [key]: !p[key] }));
  }

  return (
    <section className="bg-ink text-cream rounded-2xl p-6 md:p-7 ink-shadow-lg relative overflow-hidden">
      <svg className="absolute -bottom-4 -right-8 w-48 h-48 text-cream/[0.04] pointer-events-none" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="relative">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">This Week</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {' → '} {week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Stats + pills */}
        <div className="flex items-end gap-8 mb-5">
          <div>
            {totalLogged > 0 ? (
              <>
                <p className="font-display text-5xl font-light leading-none">{totalLogged.toFixed(1)}<span className="text-xl text-cream/50 italic ml-1.5">mi</span></p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">Walked · {totalPlanned} planned</p>
              </>
            ) : (
              <>
                <p className="font-display text-5xl font-light leading-none">{totalPlanned}<span className="text-xl text-cream/50 italic ml-1.5">mi</span></p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">Planned</p>
              </>
            )}
          </div>
          <div>
            <p className="font-display text-4xl font-light leading-none">{loggedDays > 0 ? loggedDays : walkDays}<span className="text-xl text-cream/50 italic ml-1.5">/ 7</span></p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">{loggedDays > 0 ? 'Logged' : 'Walk Days'}</p>
          </div>
          {hasLogs && (
            <div className="ml-auto flex flex-wrap gap-1.5 justify-end">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => handlePillClick(m.key)}
                  onPointerDown={() => startPress(m.key)}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  onContextMenu={e => e.preventDefault()}
                  className="px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-wider transition-opacity select-none"
                  style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}40`, opacity: activeMetrics[m.key] ? 1 : 0.3 }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chart: y-axis (HTML) + lines-only SVG */}
        {hasLogs && (
          <div className="flex gap-0 mb-1" style={{ height: '96px' }}>
            {/* Y-axis — HTML text, no stretching */}
            <div className="w-9 shrink-0 flex flex-col justify-between pb-1">
              {primaryMetric && yMax != null && (
                <span className="font-mono text-[8px] text-right pr-2 leading-none" style={{ color: primaryMetric.color }}>
                  {primaryMetric.invert ? primaryMetric.short(yMin) : primaryMetric.short(yMax)}
                </span>
              )}
              {primaryMetric && yMin != null && (
                <span className="font-mono text-[8px] text-right pr-2 leading-none" style={{ color: primaryMetric.color }}>
                  {primaryMetric.invert ? primaryMetric.short(yMax) : primaryMetric.short(yMin)}
                </span>
              )}
            </div>
            {/* Lines-only SVG — no text inside, safe to stretch */}
            <div className="flex-1">
              <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                {/* Subtle grid lines */}
                {[0, 0.5, 1].map(v => (
                  <line key={v} x1="0" y1={yAt(v, false).toFixed(1)} x2="100" y2={yAt(v, false).toFixed(1)}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
                ))}
                {/* Metric lines */}
                {METRICS.map(metric => {
                  if (!activeMetrics[metric.key]) return null;
                  const pts = buildPoints(week, walkLogsByDate, metric);
                  const d = buildPath(pts, metric);
                  return d ? <path key={metric.key} d={d} stroke={metric.color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /> : null;
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Week strip — HTML grid aligned with chart x-axis */}
        <div className="flex">
          {hasLogs && <div className="w-9 shrink-0" />}
          <div className="flex-1 grid grid-cols-7">
            {week.map(d => {
              const key = isoDate(d);
              const entry = walkingPlan[key];
              const log = walkLogsByDate?.[key];
              const isSelected = key === isoDate(selectedDate);
              const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
              const mileLabel = log ? String(log.distanceMiles ?? '✓')
                : entry?.miles ? String(entry.miles)
                : entry?.rest ? '—' : '';

              let barClass = 'w-full h-1 rounded-full ';
              if (log) barClass += 'bg-sage-400';
              else if (entry?.rest) barClass += 'bg-rose-300';
              else if (entry?.miles) barClass += 'bg-cream/20';
              else barClass += 'bg-cream/10';

              return (
                <button
                  key={key}
                  onClick={() => log && onLogClick?.(log)}
                  disabled={!log}
                  className={`text-center ${log ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={barClass} />
                  <p className={`font-mono text-[10px] mt-1.5 ${isSelected ? 'text-cream' : 'text-cream/40'}`}>{dayLetter}</p>
                  <p className={`font-mono text-[9px] mt-0.5 h-3 ${log ? 'text-sage-400' : 'text-cream/25'}`}>{mileLabel}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {detailMetric && (
        <DetailModal week={week} walkLogsByDate={walkLogsByDate} metric={detailMetric} onClose={() => setDetailMetric(null)} />
      )}
    </section>
  );
}
