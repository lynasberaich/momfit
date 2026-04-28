import { supabase } from '../lib/supabase.js';

// Map DB snake_case row → JS camelCase object
function fromDb(row) {
  return {
    id: row.id,
    date: row.date,
    distanceMiles: row.distance_miles,
    durationMinutes: row.duration_minutes,
    averagePaceMinPerMile: row.average_pace_min_per_mile,
    steps: row.steps,
    loggedAt: row.logged_at,
  };
}

export async function getWalkLogs() {
  const { data, error } = await supabase
    .from('walk_logs')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(fromDb);
}

export async function saveWalkLog(log) {
  const { data, error } = await supabase
    .from('walk_logs')
    .insert({
      date: log.date ?? null,
      distance_miles: log.distanceMiles ?? null,
      duration_minutes: log.durationMinutes ?? null,
      average_pace_min_per_mile: log.averagePaceMinPerMile ?? null,
      steps: log.steps ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function deleteWalkLog(id) {
  const { error } = await supabase.from('walk_logs').delete().eq('id', id);
  if (error) throw error;
}
