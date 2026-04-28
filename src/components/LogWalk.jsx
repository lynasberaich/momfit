import { useState, useRef } from 'react';
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
  steps: '',
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
        steps: json.steps != null ? String(json.steps) : '',
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
        steps: draft.steps !== '' ? parseInt(draft.steps, 10) : null,
      });
      reset();
      onSaved?.();
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

  // ── Preview ───────────────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div className="bg-cream border border-ink/10 rounded-2xl p-5 space-y-4 ink-shadow animate-fade-up">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">Screenshot ready</p>
        <img
          src={previewDataUrl}
          alt="Health screenshot preview"
          className="w-full max-h-64 object-contain rounded-xl border border-ink/10 bg-ink/[0.02]"
        />
        {error && (
          <p className="font-mono text-xs text-rose-500 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={analyze}
            className="flex-1 py-3 bg-sage-700 text-cream rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-sage-600 transition-colors"
          >
            Read Stats
          </button>
          <button
            onClick={reset}
            className="px-5 py-3 border border-ink/20 text-ink/50 rounded-xl font-mono text-xs uppercase tracking-widest hover:border-ink/40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="bg-cream border border-ink/10 rounded-2xl p-10 flex flex-col items-center gap-4 ink-shadow">
        <div className="w-7 h-7 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-display italic text-ink/50 text-lg">Reading your screenshot…</p>
      </div>
    );
  }

  // ── Saving ────────────────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="bg-cream border border-ink/10 rounded-2xl p-10 flex flex-col items-center gap-4 ink-shadow">
        <div className="w-7 h-7 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-display italic text-ink/50 text-lg">Saving your walk…</p>
      </div>
    );
  }

  // ── Confirming ────────────────────────────────────────────────────────────
  const fields = [
    { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD', type: 'text' },
    { key: 'distanceMiles', label: 'Distance (miles)', placeholder: '2.3', type: 'number' },
    { key: 'durationMinutes', label: 'Duration (minutes)', placeholder: '42', type: 'number', hint: draft.durationMinutes ? formatDuration(parseFloat(draft.durationMinutes)) : null },
    { key: 'averagePaceMinPerMile', label: 'Avg Pace (min/mi)', placeholder: '18:30', type: 'text' },
    { key: 'steps', label: 'Steps', placeholder: '4800', type: 'number' },
  ];

  return (
    <div className="bg-cream border border-ink/10 rounded-2xl p-5 space-y-5 ink-shadow animate-fade-up">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 mb-1">
          {previewDataUrl ? 'Stats extracted — review & save' : 'Enter walk stats'}
        </p>
        <p className="font-display italic text-ink/55 text-sm">
          Correct anything before saving.
        </p>
      </div>

      <div className="space-y-3">
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

      <div className="flex gap-3">
        <button
          onClick={save}
          className="flex-1 py-3 bg-sage-700 text-cream rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-sage-600 transition-colors"
        >
          Save Walk
        </button>
        <button
          onClick={reset}
          className="px-5 py-3 border border-ink/20 text-ink/50 rounded-xl font-mono text-xs uppercase tracking-widest hover:border-ink/40 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
