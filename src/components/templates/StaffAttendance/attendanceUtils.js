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

/** End of a session for time maths: check-out, or `now` while it is still open. */
function sessionEnd(record, now) {
  return record.checkOut ? new Date(record.checkOut).getTime() : now.getTime();
}

/** Minutes of unpaid break (e.g. lunch) in one session. A running break counts up to `now`. */
export function breakMinutes(record, now = new Date()) {
  if (!record?.checkIn || !record?.breaks?.length) return 0;
  if (record.missedCheckOut && !record.checkOut) return 0;
  const end = sessionEnd(record, now);
  return record.breaks.reduce((sum, b) => {
    const from = new Date(b.start).getTime();
    // A finished lunch counts to its real end; only a running one counts up to `now`
    const to = b.end
      ? Math.min(new Date(b.end).getTime(), record.checkOut ? end : Infinity)
      : Math.min(now.getTime(), end);
    return sum + Math.max(0, (to - from) / 60000);
  }, 0);
}

/** The break that is still running in an open session, if any. */
export function openBreak(record) {
  if (!record || record.checkOut || record.missedCheckOut) return null;
  return record.breaks?.find((b) => !b.end) || null;
}

/** Minutes worked in one session (breaks not counted). Open sessions count up to `now`. */
export function sessionMinutes(record, now = new Date()) {
  if (!record?.checkIn) return 0;
  if (record.missedCheckOut && !record.checkOut) return 0;
  const start = new Date(record.checkIn).getTime();
  const end = sessionEnd(record, now);
  // Exact (fractional) minutes, so totals aren't rounded before display
  return Math.max(0, (end - start) / 60000 - breakMinutes(record, now));
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
    return {
      status: "absent",
      minutes: 0,
      breakMinutes: 0,
      sessions,
      firstIn: null,
      lastOut: null,
      openSince: null,
      onBreakSince: null,
    };
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
    breakMinutes: sessions.reduce((sum, r) => sum + breakMinutes(r, now), 0),
    // Start of the break that is running right now (for "On break since ...")
    onBreakSince: openBreak(open) ? new Date(openBreak(open).start) : null,
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

// ---------- Planned vs actual + missing-record flags ----------

const pad2 = (n) => String(n).padStart(2, "0");
export const dayKeyOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** "12:30–13:00" style text for a session's lunch breaks. */
export function lunchText(sessions = [], locale = "en") {
  return sessions
    .flatMap((s) => s.breaks || [])
    .map((b) => `${formatTime(b.start, locale)}–${b.end ? formatTime(b.end, locale) : "?"}`)
    .join(", ");
}

/**
 * Problems with a staff member's day:
 * - noClockIn:     rostered to work, the day is over (or the shift ended) and there is no record
 * - noClockOut:    a session was never clocked out
 * - noLunchReturn: lunch was started but never ended
 */
export function dayFlags(summary, scheduled, date, now = new Date()) {
  const flags = [];
  const works =
    scheduled &&
    (scheduled.type === "shift" ||
      (scheduled.type === "ro" && scheduled.roDecision === "declined" && scheduled.startTime));
  if (works && summary.status === "absent") {
    const dayOver = dayKeyOf(date) < dayKeyOf(now);
    let shiftOver = false;
    if (!dayOver && dayKeyOf(date) === dayKeyOf(now) && scheduled.startTime) {
      const [h, m] = scheduled.startTime.split(":").map(Number);
      // 30 minutes after the planned start counts as missing
      shiftOver = now.getHours() * 60 + now.getMinutes() > h * 60 + m + 30;
    }
    if (dayOver || shiftOver) flags.push("noClockIn");
  }
  if (summary.sessions?.some((s) => s.missedCheckOut && !s.checkOut)) flags.push("noClockOut");
  if (
    summary.sessions?.some(
      (s) => (s.checkOut || s.missedCheckOut) && s.breaks?.some((b) => !b.end),
    )
  )
    flags.push("noLunchReturn");
  return flags;
}

/** True when any session of the day was corrected or added by a manager. */
export function isCorrected(sessions = []) {
  return sessions.some((s) => s.manual || s.corrections?.length);
}
