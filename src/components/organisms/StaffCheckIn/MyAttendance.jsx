"use client";
import {
  addDays,
  breakMinutes,
  dayFlags,
  dayKeyOf,
  formatDuration,
  formatTime,
  getWeekDays,
  getWeekRangeParams,
  getWeekStart,
  isSameDay,
  summarizeDay,
} from "@/components/templates/StaffAttendance/attendanceUtils";
import { ENTRY_CODES, entryMinutes, isWorking } from "@/components/templates/StaffRostering/rosterUtils";
import useAxios from "@/interceptor/axios-functions";
import { mergeClass } from "@/resources/utils/helper";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { LuLock, LuPencilLine, LuTriangleAlert } from "react-icons/lu";
import styles from "./MyAttendance.module.css";

// Bars are scaled to at least a normal 8-hour day so short days look short
const CHART_MIN_SCALE_MINUTES = 8 * 60;

/**
 * Loads the logged-in staff member's attendance for a week (with that week's
 * issued roster) and for the week's month, and works out the totals.
 * Shared by the check-in panel and the My Attendance page.
 */
export function useMyAttendanceData(now, refreshKey) {
  const { Get } = useAxios();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [week, setWeek] = useState(null);
  const [month, setMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekKey = dayKeyOf(weekStart);
  const isCurrentWeek = weekKey === dayKeyOf(getWeekStart());
  // The month the week's Monday is in
  const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
  const monthEnd = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 1);

  useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    const weekParams = new URLSearchParams({ ...getWeekRangeParams(weekStart), weekStart: weekKey });
    const monthParams = new URLSearchParams({
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
    });
    Promise.all([
      Get({ route: `staff-attendance/me?${weekParams}`, showAlert: false }),
      Get({ route: `staff-attendance/me?${monthParams}`, showAlert: false }),
    ]).then(([w, m]) => {
      if (current !== requestId.current) return;
      setWeek(w.response?.data || null);
      setMonth(m.response?.data || null);
      setLoading(false);
    });
  }, [weekKey, refreshKey]);

  const records = week?.records || [];
  const scheduledByDay = Object.fromEntries((week?.scheduled || []).map((e) => [e.date, e]));
  const days = weekDays.map((date) => {
    const summary = summarizeDay(records, date, now);
    const scheduled = scheduledByDay[dayKeyOf(date)] || null;
    return {
      date,
      ...summary,
      scheduled,
      planned: entryMinutes(scheduled),
      flags: dayFlags(summary, scheduled, date, now),
    };
  });

  const worked = days.filter((d) => d.status !== "absent");
  const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0);
  const plannedMinutes = days.reduce((sum, d) => sum + d.planned, 0);
  const lunchMinutes = days.reduce((sum, d) => sum + d.breakMinutes, 0);
  const diff = totalMinutes - plannedMinutes;

  const monthRecords = month?.records || [];
  const monthMinutes = monthRecords.reduce(
    (sum, r) => sum + summarizeDay([r], new Date(r.checkIn), now).minutes,
    0,
  );
  const monthDays = new Set(monthRecords.map((r) => dayKeyOf(new Date(r.checkIn)))).size;

  return {
    weekStart,
    setWeekStart,
    isCurrentWeek,
    loading,
    days,
    worked,
    totalMinutes,
    plannedMinutes,
    lunchMinutes,
    diff,
    monthStart,
    monthMinutes,
    monthDays,
  };
}

/**
 * Staff: their own attendance, read only. Week by week: days worked, hours
 * worked vs the roster's planned hours, every day's clock-in / lunch / clock-out,
 * missing records and corrections made by a manager. Plus a month total.
 */
export default function MyAttendance({ locale, t, now, refreshKey, variant = "panel" }) {
  const {
    weekStart,
    setWeekStart,
    isCurrentWeek,
    loading,
    days,
    worked,
    totalMinutes,
    plannedMinutes,
    lunchMinutes,
    diff,
    monthStart,
    monthMinutes,
    monthDays,
  } = useMyAttendanceData(now, refreshKey);

  const scale = Math.max(CHART_MIN_SCALE_MINUTES, ...days.map((d) => d.minutes));
  const range = `${weekStart.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${addDays(
    weekStart,
    6,
  ).toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

  return (
    <div className={mergeClass(styles.wrap, variant === "page" ? styles.page : "")}>
      <div className={styles.nav}>
        <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label={t("previousWeek")}>
          <IoChevronBack size={16} className={styles.flipRtl} />
        </button>
        <span>
          <strong>{range}</strong>
          {isCurrentWeek && <em>{t("myAtt.thisWeek")}</em>}
        </span>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          disabled={isCurrentWeek}
          aria-label={t("nextWeek")}
        >
          <IoChevronForward size={16} className={styles.flipRtl} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <div>
              <span>{t("myAtt.daysWorked")}</span>
              <strong>{worked.length}</strong>
            </div>
            <div>
              <span>{t("myAtt.hoursWorked")}</span>
              <strong>{formatDuration(totalMinutes)}</strong>
            </div>
            <div>
              <span>{t("myAtt.planned")}</span>
              <strong>{plannedMinutes ? formatDuration(plannedMinutes) : "-"}</strong>
            </div>
            <div>
              <span>{t("myAtt.difference")}</span>
              <strong className={plannedMinutes ? (diff < 0 ? styles.under : styles.over) : ""}>
                {plannedMinutes ? `${diff < 0 ? "−" : "+"}${formatDuration(Math.abs(diff))}` : "-"}
              </strong>
            </div>
          </div>
          <p className={styles.subline}>
            {t("myAtt.lunchWeek", { hours: formatDuration(lunchMinutes) })}
            {" · "}
            {t("myAtt.month", {
              month: monthStart.toLocaleDateString(locale, { month: "long" }),
              hours: formatDuration(monthMinutes),
              days: monthDays,
            })}
          </p>

          <div className={styles.chart}>
            {days.map((day) => {
              const isToday = isSameDay(day.date, now);
              const height = day.minutes ? Math.max(8, (day.minutes / scale) * 100) : 0;
              const plannedHeight = day.planned ? Math.min(100, (day.planned / scale) * 100) : 0;
              return (
                <div key={dayKeyOf(day.date)} className={mergeClass(styles.col, isToday ? styles.colToday : "")}>
                  <span className={styles.colValue}>{day.minutes ? formatDuration(day.minutes) : ""}</span>
                  <div className={styles.track}>
                    {plannedHeight > 0 && <i className={styles.plannedMark} style={{ bottom: `${plannedHeight}%` }} />}
                    <span
                      className={mergeClass(
                        styles.bar,
                        day.status === "checked-in" ? styles.barLive : "",
                        day.flags.length ? styles.barWarn : "",
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={styles.colLabel}>{day.date.toLocaleDateString(locale, { weekday: "narrow" })}</span>
                </div>
              );
            })}
          </div>
          <p className={styles.legend}>
            <i className={styles.legendBar} /> {t("myAtt.legendWorked")}
            <i className={styles.legendPlanned} /> {t("myAtt.legendPlanned")}
          </p>

          <div className={styles.days}>
            {days.map((day) => {
              const isToday = isSameDay(day.date, now);
              const future = day.date > now && !isToday;
              const s = day.scheduled;
              if (day.status === "absent" && !s && future) return null;
              return (
                <div
                  key={dayKeyOf(day.date)}
                  className={mergeClass(
                    styles.day,
                    isToday ? styles.dayToday : "",
                    day.flags.length ? styles.dayWarn : "",
                  )}
                >
                  <div className={styles.badge}>
                    <span>{day.date.toLocaleDateString(locale, { weekday: "short" })}</span>
                    <strong>{day.date.getDate()}</strong>
                  </div>

                  <div className={styles.body}>
                    {day.sessions.map((r) => (
                      <div key={r._id || r.checkIn} className={styles.session}>
                        <span className={styles.times}>
                          <b>{t("myAtt.in")}</b> {formatTime(r.checkIn, locale)}{" "}
                          <b>{t("myAtt.out")}</b>{" "}
                          {r.checkOut
                            ? formatTime(r.checkOut, locale)
                            : r.missedCheckOut
                              ? "—"
                              : t("inProgress")}
                        </span>
                        {(r.breaks || []).map((b) => (
                          <span key={b.start} className={styles.lunch}>
                            {t("myAtt.lunch", {
                              from: formatTime(b.start, locale),
                              to: b.end ? formatTime(b.end, locale) : "—",
                              hours: formatDuration(breakMinutes({ ...r, breaks: [b] }, now)),
                            })}
                          </span>
                        ))}
                        {(r.corrections || []).map((c, i) => (
                          <span key={i} className={styles.corrected}>
                            <LuPencilLine size={11} />
                            {t("myAtt.correctedBy", {
                              name: c.correctedBy?.fullName?.[locale] || c.correctedBy?.fullName?.en || "-",
                            })}
                            {c.reason ? ` · “${c.reason}”` : ""}
                          </span>
                        ))}
                      </div>
                    ))}

                    {s && (
                      <span className={styles.plannedLine}>
                        {isWorking(s)
                          ? t("myAtt.assignedShift", {
                              from: s.startTime,
                              to: s.endTime,
                              hours: formatDuration(entryMinutes(s)),
                            })
                          : `${t("myAtt.rostered")}: ${ENTRY_CODES[s.type] || s.type}`}
                      </span>
                    )}
                    {!s && day.status === "absent" && <span className={styles.none}>{t("myAtt.noShift")}</span>}

                    {day.flags.map((f) => (
                      <span key={f} className={styles.flag}>
                        <LuTriangleAlert size={11} />
                        {t(`myAtt.flags.${f}`)}
                      </span>
                    ))}
                  </div>

                  <span className={styles.hours}>{day.minutes ? formatDuration(day.minutes) : "-"}</span>
                </div>
              );
            })}
          </div>

          <p className={styles.readOnly}>
            <LuLock size={12} /> {t("myAtt.readOnly")}
          </p>
        </>
      )}
    </div>
  );
}
