import { useState, useRef } from 'react';
import { walkingPlan, isoDate } from '../data/plan.js';

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
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[utc.getUTCDay()]}, ${months[m - 1]} ${d}`;
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
    getValue: (log) => (log?.averagePaceMinPerMile ? parsePace(log.averagePaceMinPerMile) : null),
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

function buildPoints(week, walkLogsByDate, metric) {
  const raw = week.map((d, i) => {
    const key = isoDate(d);
    const log = walkLogsByDate?.[key];
    const value = metric.getValue(log);
    return { i, key, value };
  });

  const withData = raw.filter((p) => p.value != null);
  if (withData.length === 0) return [];

  const vals = withData.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  return raw.map((p) => ({
    ...p,
    norm: p.value != null ? (p.value - min) / range : null,
  }));
}

function chartX(i) { return i * 100 / 6; }
function chartY(norm, invert, top = 4, height = 32) {
  return top + (invert ? norm : 1 - norm) * height;
}

function buildPath(points, metric, top, height) {
  const parts = [];
  let open = false;
  points.forEach((p) => {
    if (p.norm == null) { open = false; return; }
    const x = chartX(p.i).toFixed(2);
    const y = chartY(p.norm, metric.invert, top, height).toFixed(2);
    parts.push(`${open ? 'L' : 'M'} ${x} ${y}`);
    open = true;
  });
  return parts.join(' ');
}

// ── Mini chart (inside the dark card) ────────────────────────────────────────

function MiniChart({ week, walkLogsByDate, activeMetrics }) {
  // Collect all active metric points to detect y-collisions for label placement
  const TOP = 8; const H = 24; // tighter range, leaving room for labels top+bottom

  return (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {METRICS.map((metric) => {
        if (!activeMetrics[metric.key]) return null;
        const points = buildPoints(week, walkLogsByDate, metric);
        if (points.length === 0) return null;
        const d = buildPath(points, metric, TOP, H);
        const withData = points.filter((p) => p.norm != null);
        return (
          <g key={metric.key}>
            {d && (
              <path
                d={d}
                stroke={metric.color}
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}
            {withData.map((p) => {
              const x = chartX(p.i);
              const y = chartY(p.norm, metric.invert, TOP, H);
              // Label above line if point is in lower half, below if upper half
              const labelY = y > TOP + H / 2 ? y - 3.5 : y + 6;
              return (
                <text
                  key={p.i}
                  x={x.toFixed(2)}
                  y={labelY.toFixed(2)}
                  textAnchor="middle"
                  fontSize="3.5"
                  fill={metric.color}
                  fontFamily="monospace"
                  opacity="0.85"
                >
                  {metric.short(p.value)}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Detail modal (long-press) ─────────────────────────────────────────────────

function DetailModal({ week, walkLogsByDate, metric, onClose }) {
  const points = buildPoints(week, walkLogsByDate, metric);
  const withData = points.filter((p) => p.norm != null);
  const TOP = 12; const H = 48;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ink border border-cream/10 rounded-3xl p-6 w-full max-w-xs mx-auto z-10 ink-shadow-lg animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
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

        {/* Chart */}
        <div className="h-28 w-full mb-2">
          <svg viewBox="0 0 100 72" className="w-full h-full" preserveAspectRatio="none">
            {/* Subtle grid */}
            {[0, 0.5, 1].map((v) => {
              const y = TOP + (1 - v) * H;
              return <line key={v} x1="0" y1={y.toFixed(1)} x2="100" y2={y.toFixed(1)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
            })}
            {/* Line */}
            {(() => {
              const d = buildPath(points, metric, TOP, H);
              return d ? <path d={d} stroke={metric.color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null;
            })()}
            {/* Value labels at each point (no dots) */}
            {withData.map((p) => {
              const x = chartX(p.i);
              const y = chartY(p.norm, metric.invert, TOP, H);
              const labelY = y < TOP + H / 2 ? y + 8 : y - 5;
              return (
                <g key={p.i}>
                  <text
                    x={x.toFixed(2)}
                    y={labelY.toFixed(2)}
                    textAnchor="middle"
                    fontSize="4.5"
                    fill={metric.color}
                    fontFamily="monospace"
                    opacity="0.9"
                  >
                    {metric.short(p.value)}
                  </text>
                </g>
              );
            })}
            {/* Day labels along bottom */}
            {week.map((d, i) => (
              <text
                key={i}
                x={chartX(i).toFixed(2)}
                y="70"
                textAnchor="middle"
                fontSize="4"
                fill="rgba(255,255,255,0.25)"
                fontFamily="monospace"
              >
                {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </text>
            ))}
          </svg>
        </div>

        {/* Value list */}
        <div className="space-y-2 mt-4">
          {withData.map((p) => (
            <div key={p.i} className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-cream/35">
                {formatDateShort(p.key)}
              </span>
              <span className="font-mono text-xs" style={{ color: metric.color }}>
                {metric.display(p.value)}
              </span>
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
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const totalPlanned = week.reduce((s, d) => s + (walkingPlan[isoDate(d)]?.miles || 0), 0);
  const totalLogged = week.reduce((s, d) => s + (walkLogsByDate?.[isoDate(d)]?.distanceMiles || 0), 0);
  const walkDays = week.filter((d) => walkingPlan[isoDate(d)]?.miles).length;
  const loggedDays = week.filter((d) => walkLogsByDate?.[isoDate(d)]).length;
  const hasLogs = loggedDays > 0;

  function startPress(metricKey) {
    didLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      setDetailMetric(METRICS.find((m) => m.key === metricKey));
    }, 550);
  }

  function endPress() {
    clearTimeout(longPressRef.current);
  }

  function handlePillClick(key) {
    if (!didLongPress.current) {
      setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  }

  return (
    <section className="bg-ink text-cream rounded-2xl p-7 ink-shadow-lg relative overflow-hidden">
      <svg className="absolute -bottom-4 -right-8 w-48 h-48 text-cream/[0.04] pointer-events-none" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="relative">
        {/* Date range header */}
        <div className="flex items-baseline justify-between mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">This Week</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' → '}
            {week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Stats + chart row */}
        <div className={`flex gap-5 mb-6 ${hasLogs ? 'items-start' : 'items-center'}`}>
          {/* Stats */}
          <div className="shrink-0">
            <div className="mb-4">
              {totalLogged > 0 ? (
                <>
                  <p className="font-display text-5xl font-light leading-none">
                    {totalLogged.toFixed(1)}
                    <span className="text-xl text-cream/50 italic ml-1.5">mi</span>
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">
                    Walked · {totalPlanned} planned
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-5xl font-light leading-none">
                    {totalPlanned}
                    <span className="text-xl text-cream/50 italic ml-1.5">mi</span>
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">Planned</p>
                </>
              )}
            </div>
            <div>
              <p className="font-display text-4xl font-light leading-none">
                {loggedDays > 0 ? loggedDays : walkDays}
                <span className="text-xl text-cream/50 italic ml-1.5">/ 7</span>
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">
                {loggedDays > 0 ? 'Logged' : 'Walk Days'}
              </p>
            </div>
          </div>

          {/* Chart (only when there are logs) */}
          {hasLogs && (
            <div className="flex-1 min-w-0">
              {/* Metric toggle pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handlePillClick(m.key)}
                    onPointerDown={() => startPress(m.key)}
                    onPointerUp={endPress}
                    onPointerLeave={endPress}
                    onContextMenu={(e) => e.preventDefault()}
                    className="px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-wider transition-opacity select-none"
                    style={{
                      background: `${m.color}18`,
                      color: m.color,
                      border: `1px solid ${m.color}40`,
                      opacity: activeMetrics[m.key] ? 1 : 0.3,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {/* Mini chart */}
              <div className="h-14 w-full">
                <MiniChart week={week} walkLogsByDate={walkLogsByDate} activeMetrics={activeMetrics} />
              </div>
            </div>
          )}
        </div>

        {/* Week strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const key = isoDate(d);
            const e = walkingPlan[key];
            const log = walkLogsByDate?.[key];
            const isSelected = key === isoDate(selectedDate);
            const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });

            let barClass = 'w-full h-1 rounded-full ';
            if (log) barClass += 'bg-sage-400';
            else if (e?.rest) barClass += 'bg-rose-300';
            else if (e?.miles) barClass += 'bg-cream/25';
            else barClass += 'bg-cream/10';

            return (
              <div key={key} className="text-center">
                <p className={`font-mono text-[10px] mb-1.5 ${isSelected ? 'text-cream' : 'text-cream/40'}`}>
                  {dayLetter}
                </p>
                <button
                  onClick={() => log && onLogClick?.(log)}
                  className={`w-full ${log ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={!log}
                >
                  <div className={barClass} />
                </button>
                <p className={`font-mono text-[9px] mt-1.5 h-3 ${log ? 'text-sage-400' : 'text-cream/35'}`}>
                  {log ? (log.distanceMiles ?? '✓') : e?.miles ? e.miles : e?.rest ? '—' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Long-press detail modal */}
      {detailMetric && (
        <DetailModal
          week={week}
          walkLogsByDate={walkLogsByDate}
          metric={detailMetric}
          onClose={() => setDetailMetric(null)}
        />
      )}
    </section>
  );
}
