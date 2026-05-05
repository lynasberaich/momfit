import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { saveWalkLog } from '../data/walkLogs.js';

// Compress image to JPEG at max 1280px on longest side before sending
async function compressToDataUrl(file) {
  const MAX = 1280;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}

function formatDuration(minutes) {
  if (minutes == null) return null;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const EMPTY_DRAFT = {
  date: '',
  distanceMiles: '',
  durationMinutes: '',
  averagePaceMinPerMile: '',
  heartRate: '',
  activeCalories: '',
};

// Phases: idle | preview | loading | confirming | saving
export default function LogWalk({ onSaved }) {
  const [phase, setPhase] = useState('idle');
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressToDataUrl(file);
      setPreviewDataUrl(dataUrl);
      setBase64Data(dataUrl.split(',')[1]);
      setPhase('preview');
    } catch (err) {
      setError(err.message);
    }
  }

  async function analyze() {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/parse-walk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64Data, mediaType: 'image/jpeg' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setDraft({
        date: json.date ?? '',
        distanceMiles: json.distanceMiles != null ? String(json.distanceMiles) : '',
        durationMinutes: json.durationMinutes != null ? String(json.durationMinutes) : '',
        averagePaceMinPerMile: json.averagePaceMinPerMile ?? '',
        heartRate: json.heartRate != null ? String(json.heartRate) : '',
        activeCalories: json.activeCalories != null ? String(json.activeCalories) : '',
      });
      setPhase('confirming');
    } catch (err) {
      setError(err.message);
      setPhase('preview');
    }
  }

  function enterManually() {
    setDraft(EMPTY_DRAFT);
    setPhase('confirming');
  }

  async function save() {
    setPhase('saving');
    setError(null);
    try {
      await saveWalkLog({
        date: draft.date || null,
        distanceMiles: draft.distanceMiles !== '' ? parseFloat(draft.distanceMiles) : null,
        durationMinutes: draft.durationMinutes !== '' ? parseFloat(draft.durationMinutes) : null,
        averagePaceMinPerMile: draft.averagePaceMinPerMile || null,
        heartRate: draft.heartRate !== '' ? parseInt(draft.heartRate, 10) : null,
        activeCalories: draft.activeCalories !== '' ? parseInt(draft.activeCalories, 10) : null,
      });
      reset();
      onSaved?.();
      // Celebrate!
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7a9e7e', '#c4b8a0', '#e8c8c0', '#f5e6d0', '#4a6741'],
      });
    } catch (err) {
      setError(err.message);
      setPhase('confirming');
    }
  }

  function reset() {
    setPhase('idle');
    setPreviewDataUrl(null);
    setBase64Data(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  // ── Idle ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 bg-sage-700 text-cream rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-sage-600 transition-colors ink-shadow"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="5.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 11l3-3 2.5 2.5 2.5-3 3.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Log a Walk
        </button>
        <button
          onClick={enterManually}
          className="font-mono text-xs uppercase tracking-widest text-ink/40 hover:text-ink/70 transition-colors"
        >
          Enter manually
        </button>
      </div>
    );
  }

  // ── All active phases render as a modal overlay ───────────────────────────
  const fields = [
    { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'text' },
    { key: 'distanceMiles', label: 'Distance (miles)', placeholder: '2.3', type: 'number' },
    { key: 'durationMinutes', label: 'Duration (minutes)', placeholder: '42', type: 'number', hint: draft.durationMinutes ? formatDuration(parseFloat(draft.durationMinutes)) : null },
    { key: 'averagePaceMinPerMile', label: 'Avg Pace (min/mi)', placeholder: '18:30', type: 'text' },
    { key: 'heartRate', label: 'Avg Heart Rate (bpm)', placeholder: '134', type: 'number' },
    { key: 'activeCalories', label: 'Active Calories', placeholder: '319', type: 'number' },
  ];

  let modalContent;

  if (phase === 'preview') {
    modalContent = (
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">Screenshot ready</p>
        <img
          src={previewDataUrl}
          alt="Health screenshot preview"
          className="w-full max-h-60 object-contain rounded-xl border border-ink/10 bg-ink/[0.02]"
        />
        {error && (
          <p className="font-mono text-xs text-rose-500 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={analyze} className="flex-1 py-3 bg-sage-700 text-cream rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-sage-600 transition-colors">
            Read Stats
          </button>
          <button onClick={reset} className="px-5 py-3 border border-ink/20 text-ink/50 rounded-xl font-mono text-xs uppercase tracking-widest hover:border-ink/40 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  } else if (phase === 'loading' || phase === 'saving') {
    modalContent = (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-7 h-7 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-display italic text-ink/50 text-lg">
          {phase === 'loading' ? 'Reading your screenshot…' : 'Saving your walk…'}
        </p>
      </div>
    );
  } else if (phase === 'confirming') {
    modalContent = (
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 mb-1">
            {previewDataUrl ? 'Stats extracted — review & save' : 'Enter walk stats'}
          </p>
          <p className="font-display italic text-ink/55 text-sm">Correct anything before saving.</p>
        </div>
        {error && (
          <p className="font-mono text-xs text-rose-500 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}
        <div className="space-y-2.5">
          {fields.map(({ key, label, placeholder, type, hint }) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40">
                {label}{hint ? ` · ${hint}` : ''}
              </span>
              <input
                type={type}
                value={draft[key]}
                placeholder={placeholder}
                step={type === 'number' ? 'any' : undefined}
                onChange={set(key)}
                className="bg-transparent border border-ink/20 rounded-xl px-4 py-2.5 font-mono text-sm text-ink placeholder-ink/25 focus:outline-none focus:border-sage-500 transition-colors"
              />
            </label>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={save} className="flex-1 py-3 bg-sage-700 text-cream rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-sage-600 transition-colors">
            Save Walk
          </button>
          <button onClick={reset} className="px-5 py-3 border border-ink/20 text-ink/50 rounded-xl font-mono text-xs uppercase tracking-widest hover:border-ink/40 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={phase === 'preview' || phase === 'confirming' ? reset : undefined}
      />
      <div className="relative bg-cream rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-sm mx-auto z-10 ink-shadow-lg animate-fade-up max-h-[90vh] overflow-y-auto">
        {modalContent}
      </div>
    </div>
  );
}
