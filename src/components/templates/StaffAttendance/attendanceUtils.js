// Helpers shared by the Staff Attendance page and the staff Check-In panel.
// All day grouping happens in the viewer's local timezone.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday 00:00 (local) of the week containing `date`. */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** The 7 days (Mon–Sun) of the week starting at `weekStart`. */
export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Query params for a week: [Monday 00:00, next Monday 00:00). */
export function getWeekRangeParams(weekStart) {
  return {
    startDate: weekStart.toISOString(),
    endDate: addDays(weekStart, 7).toISOString(),
  };
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Minutes worked in one session. Open sessions count up to `now`. */
export function sessionMinutes(record, now = new Date()) {
  if (!record?.checkIn) return 0;
  if (record.missedCheckOut && !record.checkOut) return 0;
  const start = new Date(record.checkIn).getTime();
  const end = record.checkOut ? new Date(record.checkOut).getTime() : now.getTime();
  // Exact (fractional) minutes, so totals aren't rounded before display
  return Math.max(0, (end - start) / 60000);
}

/**
 * Summary of one staff member's sessions on a single day.
 * status: "checked-in" | "checked-out" | "missed-checkout" | "absent"
 */
export function summarizeDay(records = [], day, now = new Date()) {
  const sessions = records
    .filter((r) => r?.checkIn && isSameDay(new Date(r.checkIn), day))
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

  if (!sessions.length) {
    return { status: "absent", minutes: 0, sessions, firstIn: null, lastOut: null, openSince: null };
  }

  const minutes = sessions.reduce((sum, r) => sum + sessionMinutes(r, now), 0);
  const open = sessions.find((r) => !r.checkOut && !r.missedCheckOut);
  const missed = sessions.some((r) => r.missedCheckOut && !r.checkOut);
  const lastClosed = [...sessions].reverse().find((r) => r.checkOut);

  return {
    status: open ? "checked-in" : missed ? "missed-checkout" : "checked-out",
    minutes,
    sessions,
    firstIn: new Date(sessions[0].checkIn),
    lastOut: lastClosed ? new Date(lastClosed.checkOut) : null,
    // Start of the session that is still running (for "In since ...")
    openSince: open ? new Date(open.checkIn) : null,
  };
}

// Smallest visible width (in %) for very short sessions on the bar
const MIN_SEGMENT_PCT = 1.2;

/**
 * Segments for a day's session bar. The bar starts at the first check-in and
 * ends at the last check-out (or now while still checked in), so worked time
 * fills it and breaks between sessions stay empty.
 * kind: "done" (checked out) | "live" (still checked in) | "missed" (no check-out)
 */
export function getSessionBar(sessions = [], now = new Date()) {
  const items = sessions.map((s) => {
    const start = new Date(s.checkIn);
    const missed = !s.checkOut && Boolean(s.missedCheckOut);
    const live = !s.checkOut && !missed;
    const end = s.checkOut ? new Date(s.checkOut) : live ? now : start;
    return { key: s._id || s.checkIn, start, end, kind: live ? "live" : missed ? "missed" : "done" };
  });
  if (!items.length) return { from: null, to: null, segments: [] };

  const from = new Date(Math.min(...items.map((i) => i.start)));
  const to = new Date(Math.max(...items.map((i) => i.end)));
  const span = to - from || 1;

  const segments = items.map((i) => {
    const width = Math.max(MIN_SEGMENT_PCT, ((i.end - i.start) / span) * 100);
    const left = Math.min(((i.start - from) / span) * 100, 100 - width);
    return { key: i.key, kind: i.kind, left: Math.max(0, left), width };
  });

  return { from, to, segments };
}

export function sumMinutes(records = [], now = new Date()) {
  return records.reduce((sum, r) => sum + sessionMinutes(r, now), 0);
}

/**
 * Decimal hours cut off (never rounded up) at 2 decimals:
 * 535.67 min (8h 55m 40s) → "8.92 h", 12 min → "0.20 h".
 */
export function formatDuration(totalMinutes) {
  const hours = Math.max(0, totalMinutes || 0) / 60;
  // Tiny epsilon stops float noise (e.g. 0.29999…) from cutting off a cent too much
  const truncated = Math.floor(hours * 100 + 1e-9) / 100;
  return `${truncated.toFixed(2)} h`;
}

export function formatTime(date, locale = "en") {
  if (!date) return "";
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayName(date, locale = "en") {
  return date.toLocaleDateString(locale, { weekday: "short" });
}

export function formatDayDate(date, locale = "en") {
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** "28 Sep 2026 – 04 Oct 2026" */
export function formatWeekLabel(weekStart, locale = "en") {
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const end = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(locale, opts)}`;
}

export function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

/** True when the week is the current week (used to disable "next week"). */
export function isCurrentOrFutureWeek(weekStart) {
  return weekStart.getTime() >= getWeekStart(new Date()).getTime();
}

export { DAY_MS };
