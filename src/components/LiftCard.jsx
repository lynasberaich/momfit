import { useState } from 'react';

export default function LiftCard({ lift, number }) {
  const [done, setDone] = useState({});

  const accent = lift.accent === 'sage'
    ? { ring: 'ring-sage-300', bg: 'bg-sage-50', text: 'text-sage-700', dot: 'bg-sage-400', tab: 'bg-sage-100 text-sage-800' }
    : { ring: 'ring-rose-300', bg: 'bg-rose-50', text: 'text-rose-500', dot: 'bg-rose-400', tab: 'bg-rose-100 text-rose-700' };

  const toggle = (key) => setDone(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="relative bg-cream border border-ink/10 rounded-2xl p-7 ink-shadow overflow-hidden">
      {/* Numeral watermark */}
      <div className="absolute -right-4 -top-2 font-display text-[180px] font-light leading-none text-ink/[0.04] select-none pointer-events-none">
        {number}
      </div>

      <div className="relative">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
            Lift
          </span>
          <span className={`font-mono text-[10px] uppercase tracking-[0.25em] ${accent.text}`}>
            ·  Day {number}
          </span>
        </div>
        <h3 className="font-display text-4xl text-ink mb-6">
          {lift.name}
        </h3>

        <div className="space-y-6">
          {lift.sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                <h4 className="font-mono text-xs uppercase tracking-widest text-ink/60">
                  {section.title} Section
                </h4>
                <span className="h-px flex-1 bg-ink/10" />
              </div>
              <ul className="space-y-1.5">
                {section.exercises.map((ex) => {
                  const key = `${section.title}-${ex.name}`;
                  const isDone = done[key];
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggle(key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                          isDone ? 'bg-ink/5' : 'hover:bg-ink/[0.03]'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                            isDone
                              ? 'bg-ink border-ink'
                              : 'border-ink/20 group-hover:border-ink/40'
                          }`}
                        >
                          {isDone && (
                            <svg className="w-3 h-3 text-cream" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6 L5 9 L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className={`flex-1 ${isDone ? 'line-through text-ink/40' : 'text-ink/85'}`}>
                          {ex.name}
                        </span>
                        <span className={`font-mono text-xs px-2 py-1 rounded ${accent.tab} ${isDone ? 'opacity-50' : ''}`}>
                          {ex.sets}×{ex.reps}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
