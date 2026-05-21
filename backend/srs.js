const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

// intervals[level] = how long to wait after answering correctly at `level`.
// Hitting level 5 = mastered (next_review = null, excluded from queue).
const INTERVALS = [10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];

export const MASTERED_LEVEL = 5;

export function srsUpdate(level, correct, now = new Date()) {
  if (!correct) {
    return { newLevel: 1, nextReview: new Date(now.getTime() + INTERVALS[0]) };
  }
  const newLevel = Math.min(level + 1, MASTERED_LEVEL);
  if (newLevel === MASTERED_LEVEL) {
    return { newLevel, nextReview: null };
  }
  return { newLevel, nextReview: new Date(now.getTime() + INTERVALS[level]) };
}

// Returns "YYYY-MM-DD" in UTC. Used for streak day-comparison.
export function utcDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function nextStreak(stats, today = utcDateStr()) {
  const last = stats.last_session_date;
  if (last === today) {
    return { streak: stats.streak, done_today: stats.done_today + 1, last_session_date: today };
  }
  const yesterday = utcDateStr(new Date(Date.now() - DAY));
  if (last === yesterday) {
    return { streak: stats.streak + 1, done_today: 1, last_session_date: today };
  }
  return { streak: 1, done_today: 1, last_session_date: today };
}
