import { useState, useRef } from 'react';
import { walkingPlan, isoDate } from '../data/plan.js';

// ── Palette refs (from tailwind.config.js) ────────────────────────────────────
const SAGE_400 = '#86A06F';
const SAGE_300 = '#A8BD97';
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

// ── SVG coordinate helpers ────────────────────────────────────────────────────
// 7 day positions with equal padding on both sides
const PAD_X = 8;
const SPAN_X = 84;
function xAt(i) { return PAD_X + i * (SPAN_X / 6); }

const CHART_TOP = 4;
const CHART_H   = 42;
function yAt(norm, invert) {
  return CHART_TOP + (invert ? norm : 1 - norm) * CHART_H;
}

// ── Chart data builder ────────────────────────────────────────────────────────

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

function buildPath(points, metric) {
  const parts = [];
  let open = false;
  points.forEach((p) => {
    if (p.norm == null) { open = false; return; }
    const x = xAt(p.i).toFixed(2);
    const y = yAt(p.norm, metric.invert).toFixed(2);
    parts.push(`${open ? 'L' : 'M'} ${x} ${y}`);
    open = true;
  });
  return parts.join(' ');
}

// ── Detail modal (long-press) ─────────────────────────────────────────────────

function DetailModal({ week, walkLogsByDate, metric, onClose }) {
  const points = buildPoints(week, walkLogsByDate, metric);
  const withData = points.filter((p) => p.norm != null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ink border border-cream/10 rounded-3xl p-6 w-full max-w-xs mx-auto z-10 ink-shadow-lg animate-fade-up">
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

        {/* Annotated chart */}
        <svg viewBox="0 0 100 70" className="w-full" style={{ height: '140px' }} preserveAspectRatio="none">
          {/* Subtle grid */}
          {[0, 0.5, 1].map((v) => {
            const y = yAt(v, metric.invert);
            return <line key={v} x1={PAD_X} y1={y.toFixed(1)} x2={PAD_X + SPAN_X} y2={y.toFixed(1)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
          })}
          {/* Line */}
          {(() => {
            const d = buildPath(points, metric);
            return d ? <path d={d} stroke={metric.color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null;
          })()}
          {/* Value labels */}
          {withData.map((p) => {
            const x = xAt(p.i);
            const y = yAt(p.norm, metric.invert);
            const labelY = y > CHART_TOP + CHART_H / 2 ? y - 4 : y + 7;
            return (
              <text key={p.i} x={x.toFixed(2)} y={labelY.toFixed(2)} textAnchor="middle" fontSize="4.5" fill={metric.color} fontFamily="monospace" opacity="0.9">
                {metric.short(p.value)}
              </text>
            );
          })}
          {/* Day labels */}
          {week.map((d, i) => (
            <text key={i} x={xAt(i).toFixed(2)} y="56" textAnchor="middle" fontSize="4" fill="rgba(250,246,240,0.25)" fontFamily="monospace">
              {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
            </text>
          ))}
        </svg>

        {/* Value list */}
        <div className="space-y-2 mt-2">
          {withData.map((p) => (
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
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const totalPlanned = week.reduce((s, d) => s + (walkingPlan[isoDate(d)]?.miles || 0), 0);
  const totalLogged  = week.reduce((s, d) => s + (walkLogsByDate?.[isoDate(d)]?.distanceMiles || 0), 0);
  const walkDays  = week.filter((d) => walkingPlan[isoDate(d)]?.miles).length;
  const loggedDays = week.filter((d) => walkLogsByDate?.[isoDate(d)]).length;
  const hasLogs = loggedDays > 0;

  function startPress(metricKey) {
    didLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      setDetailMetric(METRICS.find((m) => m.key === metricKey));
    }, 550);
  }
  function endPress() { clearTimeout(longPressRef.current); }
  function handlePillClick(key) {
    if (!didLongPress.current) setActiveMetrics((p) => ({ ...p, [key]: !p[key] }));
  }

  // ── Unified SVG: chart lines + day strip ──────────────────────────────────
  // viewBox: 0 0 100 70
  //   y 4–46   → chart area  (CHART_TOP=4, CHART_H=42)
  //   y 50     → strip bars
  //   y 57     → day letters
  //   y 65     → logged mile values

  const STRIP_Y   = 50;
  const LETTER_Y  = 57;
  const VALUE_Y   = 65;
  const BAR_W     = 11; // bar half-width on each side of center

  return (
    <section className="bg-ink text-cream rounded-2xl p-6 md:p-7 ink-shadow-lg relative overflow-hidden">
      <svg className="absolute -bottom-4 -right-8 w-48 h-48 text-cream/[0.04] pointer-events-none" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="relative">
        {/* Top row: label + date range */}
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">This Week</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/50">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' → '}
            {week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-end gap-8 mb-4">
          <div>
            {totalLogged > 0 ? (
              <>
                <p className="font-display text-5xl font-light leading-none">
                  {totalLogged.toFixed(1)}<span className="text-xl text-cream/50 italic ml-1.5">mi</span>
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">
                  Walked · {totalPlanned} planned
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-5xl font-light leading-none">
                  {totalPlanned}<span className="text-xl text-cream/50 italic ml-1.5">mi</span>
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">Planned</p>
              </>
            )}
          </div>
          <div>
            <p className="font-display text-4xl font-light leading-none">
              {loggedDays > 0 ? loggedDays : walkDays}<span className="text-xl text-cream/50 italic ml-1.5">/ 7</span>
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-cream/50 mt-1.5">
              {loggedDays > 0 ? 'Logged' : 'Walk Days'}
            </p>
          </div>

          {/* Metric pills — pushed to right */}
          {hasLogs && (
            <div className="ml-auto flex flex-wrap gap-1.5 justify-end">
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
          )}
        </div>

        {/* Unified chart + strip SVG */}
        <svg
          viewBox="0 0 100 68"
          className="w-full"
          style={{ height: hasLogs ? '160px' : '52px' }}
          preserveAspectRatio="none"
        >
          {/* Chart lines + labels (only when logs exist) */}
          {hasLogs && METRICS.map((metric) => {
            if (!activeMetrics[metric.key]) return null;
            const points = buildPoints(week, walkLogsByDate, metric);
            if (points.length === 0) return null;
            const d = buildPath(points, metric);
            const withData = points.filter((p) => p.norm != null);
            return (
              <g key={metric.key}>
                {d && <path d={d} stroke={metric.color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />}
                {withData.map((p) => {
                  const x = xAt(p.i);
                  const y = yAt(p.norm, metric.invert);
                  const labelY = y > CHART_TOP + CHART_H / 2 ? y - 3.5 : y + 6;
                  return (
                    <text key={p.i} x={x.toFixed(2)} y={labelY.toFixed(2)} textAnchor="middle" fontSize="3.5" fill={metric.color} fontFamily="monospace" opacity="0.85">
                      {metric.short(p.value)}
                    </text>
                  );
                })}
              </g>
            );
          })}

          {/* Subtle separator between chart and strip */}
          {hasLogs && <line x1="0" y1="47" x2="100" y2="47" stroke="rgba(250,246,240,0.06)" strokeWidth="0.4" />}

          {/* Week strip — bars, day letters, logged values */}
          {week.map((d, i) => {
            const key = isoDate(d);
            const entry = walkingPlan[key];
            const log = walkLogsByDate?.[key];
            const isSelected = key === isoDate(selectedDate);
            const cx = xAt(i);

            let barFill = 'rgba(250,246,240,0.10)';
            if (log)        barFill = SAGE_400;
            else if (entry?.rest) barFill = ROSE_300;
            else if (entry?.miles) barFill = 'rgba(250,246,240,0.22)';

            const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
            const mileLabel = log
              ? String(log.distanceMiles ?? '✓')
              : entry?.miles ? String(entry.miles)
              : entry?.rest ? '—' : '';

            return (
              <g key={key} onClick={() => log && onLogClick?.(log)} style={{ cursor: log ? 'pointer' : 'default' }}>
                {/* Bar */}
                <rect
                  x={(cx - BAR_W / 2).toFixed(2)}
                  y={STRIP_Y - 0.75}
                  width={BAR_W}
                  height="1.5"
                  rx="0.75"
                  fill={barFill}
                />
                {/* Day letter */}
                <text
                  x={cx.toFixed(2)}
                  y={LETTER_Y}
                  textAnchor="middle"
                  fontSize="4"
                  fill={isSelected ? CREAM : 'rgba(250,246,240,0.35)'}
                  fontFamily="monospace"
                  fontWeight={isSelected ? '600' : '400'}
                >
                  {dayLetter}
                </text>
                {/* Logged miles or planned */}
                <text
                  x={cx.toFixed(2)}
                  y={VALUE_Y}
                  textAnchor="middle"
                  fontSize="3.5"
                  fill={log ? SAGE_400 : 'rgba(250,246,240,0.25)'}
                  fontFamily="monospace"
                >
                  {mileLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

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
