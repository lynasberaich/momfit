// Walking plan extracted from the May & June 2026 calendars.
// Keys are ISO date strings: 'YYYY-MM-DD'.
// Each entry: { miles, intervals?, rest? }

export const walkingPlan = {
  // ===== Month 1 — May 2026 =====
  '2026-05-03': { miles: 2 },
  '2026-05-04': { rest: true },
  '2026-05-05': { miles: 2 },
  '2026-05-06': { miles: 1.5 },
  '2026-05-07': { miles: 2 },
  '2026-05-08': { miles: 1.5 },
  '2026-05-09': { miles: 2 },

  '2026-05-10': { miles: 2.5 },
  '2026-05-11': { rest: true },
  '2026-05-12': { miles: 2 },
  '2026-05-13': { miles: 2.5 },
  '2026-05-14': { miles: 2 },
  '2026-05-15': { miles: 1.5 },
  '2026-05-16': { miles: 2 },

  '2026-05-17': { miles: 2.5 },
  '2026-05-18': { rest: true },
  '2026-05-19': { miles: 2.5 },
  '2026-05-20': { miles: 2 },
  '2026-05-21': { miles: 2.5 },
  '2026-05-22': { miles: 2 },
  '2026-05-23': { miles: 2.5 },

  '2026-05-24': { miles: 2.5 },
  '2026-05-25': { rest: true },
  '2026-05-26': { miles: 2.5 },
  '2026-05-27': { miles: 2 },
  '2026-05-28': { miles: 2.5 },
  '2026-05-29': { miles: 2 },
  '2026-05-30': { miles: 2.5 },

  '2026-05-31': { miles: 3 },

  // ===== Month 2 — June 2026 =====
  '2026-06-01': { rest: true },
  '2026-06-02': { miles: 3 },
  '2026-06-03': { miles: 2.5 },
  '2026-06-04': { miles: 3 },
  '2026-06-05': { miles: 2.5 },
  '2026-06-06': { miles: 3 },

  '2026-06-07': { miles: 3 },
  '2026-06-08': { rest: true },
  '2026-06-09': { miles: 3 },
  '2026-06-10': { miles: 2.5 },
  '2026-06-11': { miles: 3 },
  '2026-06-12': { miles: 2.5 },
  '2026-06-13': { miles: 3 },

  '2026-06-14': { miles: 3.25, intervals: '2 min fast / 2 min easy' },
  '2026-06-15': { rest: true },
  '2026-06-16': { miles: 3 },
  '2026-06-17': { miles: 3.25, intervals: '2 min fast / 2 min easy' },
  '2026-06-18': { miles: 3 },
  '2026-06-19': { miles: 2.5, intervals: '2 min fast / 1 min easy' },
  '2026-06-20': { miles: 3 },

  '2026-06-21': { miles: 3.25, intervals: '2 min fast / 2 min easy' },
  '2026-06-22': { rest: true },
  '2026-06-23': { miles: 3 },
  '2026-06-24': { miles: 3.25, intervals: '2 min fast / 2 min easy' },
  '2026-06-25': { miles: 3 },
  '2026-06-26': { miles: 2.5, intervals: '2 min fast / 1 min easy' },
  '2026-06-27': { miles: 3 },

  '2026-06-28': { miles: 3.5, intervals: '2 min fast / 2 min easy' },
  '2026-06-29': { rest: true },
  '2026-06-30': { miles: 3 },
};

// ===== Lifting plan: 2 lifts per week whenever possible =====
export const liftingPlan = {
  liftOne: {
    name: 'Lift #1',
    accent: 'sage',
    sections: [
      {
        title: 'Dumbbell',
        exercises: [
          { name: 'RDLs', sets: 3, reps: 12, videoUrl: 'https://www.youtube.com/watch?v=5WxMW-Fu5KU' },
          { name: 'Lateral Lunge', sets: 3, reps: 8, videoUrl: 'https://www.youtube.com/watch?v=lrhTa-GqCPY' },
          { name: 'Dumbbell Squats', sets: 3, reps: 10, videoUrl: 'https://www.youtube.com/watch?v=v_c67Omje48' },
        ],
      },
      {
        title: 'Machine',
        exercises: [
          { name: 'Leg Extension', sets: 3, reps: 8, videoUrl: 'https://www.youtube.com/watch?v=EE9z0z2dQMU' },
          { name: 'Hip Abductor', sets: 3, reps: 8, videoUrl: 'https://www.youtube.com/watch?v=0PPaAG3-v6U' },
        ],
      },
    ],
  },
  liftTwo: {
    name: 'Lift #2',
    accent: 'rose',
    sections: [
      {
        title: 'Dumbbell',
        exercises: [
          { name: 'Bicep Curl', sets: 3, reps: 12, videoUrl: 'https://www.youtube.com/watch?v=mebsnWJRasA' },
          { name: 'Shoulder Press', sets: 3, reps: 10, videoUrl: 'https://www.youtube.com/watch?v=Did01dFR3Lk' },
          { name: 'Front Raise / Lateral Raise', sets: 3, reps: 8, videoUrl: 'https://www.youtube.com/watch?v=6vdhFbacXms' },
        ],
      },
      {
        title: 'Machine',
        exercises: [
          { name: 'Chest Press', sets: 3, reps: 12, videoUrl: 'https://www.youtube.com/watch?v=G7I9zRCXKxY' },
          { name: 'Lat Pulldown', sets: 3, reps: 12, videoUrl: 'https://www.youtube.com/watch?v=g-AJPkaqxSc' },
        ],
      },
    ],
  },
};

// Helper: format a date as 'YYYY-MM-DD' in local time
export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
