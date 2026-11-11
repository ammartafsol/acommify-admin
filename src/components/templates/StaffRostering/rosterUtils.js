// Helpers for the weekly Staff Roster. Roster days are plain calendar days
// ('YYYY-MM-DD'); shift times are 'HH:mm' in the centre's local time.

export const ENTRY_TYPES = ["shift", "off", "ro", "hol", "bhol"];

// The roster codes managers and staff already know — shown as-is in every language
export const ENTRY_CODES = {
  shift: "",
  off: "OFF",
  ro: "R/O",
  hol: "HOL",
  bhol: "B/HOL",
};

export const BREAK_OPTIONS = [0, 15, 20, 30, 45, 60, 90];
export const DEFAULT_SHIFT = {
  startTime: "08:00",
  endTime: "16:00",
  breakMinutes: 30,
};

const pad = (n) => String(n).padStart(2, "0");

/** Local calendar day of a Date as 'YYYY-MM-DD'. */
export function toDayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function entryKey(staffId, dayKey) {
  return `${staffId}_${dayKey}`;
}

export function toMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time || "")) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Shift length in minutes; an end before the start runs past midnight. */
export function shiftLength(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || start === end) return 0;
  const diff = end - start;
  return diff > 0 ? diff : diff + 24 * 60;
}

export function isOvernight(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  return start !== null && end !== null && end < start;
}

/** True when the staff member works that day (a shift, or an R/O the manager declined). */
export function isWorking(entry) {
  if (!entry) return false;
  return (
    entry.type === "shift" ||
    (entry.type === "ro" &&
      entry.roDecision === "declined" &&
      !!entry.startTime)
  );
}

/** Paid / scheduled minutes of an entry: shift length minus the unpaid break. */
export function entryMinutes(entry) {
  if (!isWorking(entry) || !entry.startTime || !entry.endTime) return 0;
  return Math.max(
    0,
    shiftLength(entry.startTime, entry.endTime) -
      (Number(entry.breakMinutes) || 0),
  );
}

/** 450 → "7.5 h", 480 → "8 h", 445 → "7.41 h" (cut off, never rounded up). */
export function formatHours(minutes) {
  const hours = Math.floor((Math.max(0, minutes || 0) / 60) * 100 + 1e-9) / 100;
  return `${hours} h`;
}

export function isPendingRo(entry) {
  return (
    entry?.type === "ro" &&
    (!entry.roDecision || entry.roDecision === "pending")
  );
}

/** Only the fields the API stores, in a clean shape. */
export function cleanEntry(entry) {
  const works = isWorking(entry) || entry.type === "shift";
  return {
    staff: String(entry.staff?._id || entry.staff),
    date: entry.date,
    type: entry.type,
    startTime: works ? entry.startTime || null : null,
    endTime: works ? entry.endTime || null : null,
    breakMinutes: works ? Number(entry.breakMinutes) || 0 : 0,
    roDecision: entry.type === "ro" ? entry.roDecision || "pending" : null,
    note: (entry.note || "").trim(),
  };
}

/** { key: entry } map from an API entries array. */
export function toEntryMap(entries = []) {
  return entries.reduce((map, e) => {
    const clean = cleanEntry(e);
    map[entryKey(clean.staff, clean.date)] = clean;
    return map;
  }, {});
}

/** Stable string of a map, used to know when there are unsaved changes. */
export function signature(map = {}) {
  return JSON.stringify(
    Object.keys(map)
      .sort()
      .map((k) => {
        const e = map[k];
        return [
          k,
          e.type,
          e.startTime,
          e.endTime,
          e.breakMinutes,
          e.roDecision,
          e.note,
        ];
      }),
  );
}
