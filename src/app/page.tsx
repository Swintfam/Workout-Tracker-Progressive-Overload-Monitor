import {
  getWeeklyRepTotals,
  getWeeklySessionCount,
  getWeeklyVolumeByDay,
  getLastSession,
  getNextPlannedSession,
  REP_TARGETS,
} from "@/lib/workouts";

// ...

const [repTotals, sessionCount, volumeByDay, lastSession, weekMood, nextSession] = await Promise.all([
  getWeeklyRepTotals(),
  getWeeklySessionCount(),
  getWeeklyVolumeByDay(),
  getLastSession(),
  getWeekMood(),
  getNextPlannedSession(),
]);

// ...

<NextSessionPanel lastSession={lastSession} nextSession={nextSession} />
