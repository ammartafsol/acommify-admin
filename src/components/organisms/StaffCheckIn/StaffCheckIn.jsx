"use client";
import RenderToast from "@/components/atoms/RenderToast";
import {
  formatDuration,
  formatTime,
  getWeekDays,
  getWeekRangeParams,
  getWeekStart,
  addDays,
  isSameDay,
  sumMinutes,
  summarizeDay,
} from "@/components/templates/StaffAttendance/attendanceUtils";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { LuCalendarCheck, LuChevronDown, LuChevronRight, LuClock } from "react-icons/lu";
import styles from "./StaffCheckIn.module.css";

/** Floating check-in button + panel for staff. `onChange` runs after a check-in/out. */
export default function StaffCheckIn({ onChange }) {
  const t = useTranslations("staffCheckIn");
  const locale = useLocale();
  const { Get, Post } = useAxios();

  const [open, setOpen] = useState(false);
  const [showWeek, setShowWeek] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [current, setCurrent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState("loading");

  const weekStart = useMemo(() => getWeekStart(now), [now.toDateString()]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  async function getMyAttendance() {
    const params = new URLSearchParams(getWeekRangeParams(weekStart)).toString();
    const { response } = await Get({
      route: `staff-attendance/me?${params}`,
      showAlert: false,
    });
    if (response) {
      setCurrent(response?.data?.current || null);
      setRecords(Array.isArray(response?.data?.records) ? response.data.records : []);
    }
    setLoading("");
  }

  useEffect(() => {
    getMyAttendance();
  }, [weekStart]);

  // Live clock while the panel is open, otherwise refresh each minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), open ? 1000 : 60 * 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function toggleCheckIn() {
    const action = current ? "check-out" : "check-in";
    setLoading(action);
    const { response } = await Post({ route: `staff-attendance/${action}` });
    if (response) {
      RenderToast({
        type: "success",
        message: action === "check-in" ? t("checkedInToast") : t("checkedOutToast"),
      });
    }
    // Refresh either way so the panel matches the server (e.g. already checked in elsewhere)
    await getMyAttendance();
    onChange?.();
    setLoading("");
  }

  const today = summarizeDay(records, now, now);
  const weekTotal = sumMinutes(records, now);
  const isCheckedIn = Boolean(current);

  let statusTitle = t("notCheckedIn");
  let statusText = t("readyToStart");
  let statusTone = "idle";
  if (isCheckedIn) {
    statusTitle = t("checkedInSince", { time: formatTime(current.checkIn, locale) });
    statusText = t("workedToday", { hours: formatDuration(today.minutes) });
    statusTone = "in";
  } else if (today.status === "checked-out") {
    statusTitle = t("checkedOutAt", { time: formatTime(today.lastOut, locale) });
    statusText = t("workedToday", { hours: formatDuration(today.minutes) });
    statusTone = "out";
  }

  const weekRange = `${weekStart.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })} – ${addDays(weekStart, 6).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })}`;

  return (
    <>
      <button
        type="button"
        className={mergeClass(styles.fab, isCheckedIn ? styles.fabActive : "")}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("open")}
        aria-expanded={open}
      >
        <LuClock size={26} />
        {isCheckedIn && <span className={styles.fabDot} />}
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.panel} role="dialog" aria-label={t("title")}>
            <span className={styles.handle} />
            <div className={styles.panelHeader}>
              <h2>{t("title")}</h2>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label={t("close")}
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className={styles.clock}>
              <strong>
                {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </strong>
              <span>
                {now.toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className={mergeClass(styles.status, styles[statusTone])}>
              <i />
              <div>
                <p>{statusTitle}</p>
                <span>{statusText}</span>
              </div>
            </div>

            <button
              type="button"
              className={mergeClass(styles.primary, isCheckedIn ? styles.checkOut : "")}
              onClick={toggleCheckIn}
              disabled={loading !== ""}
            >
              {loading === "check-in" || loading === "check-out" ? (
                <Spinner size="sm" />
              ) : isCheckedIn ? (
                t("checkOut")
              ) : (
                t("checkIn")
              )}
            </button>

            <p className={styles.divider}>{t("recentActivity")}</p>

            <button
              type="button"
              className={styles.row}
              onClick={() => setShowWeek((v) => !v)}
              aria-expanded={showWeek}
            >
              <LuCalendarCheck size={18} />
              <span className={styles.rowText}>
                <strong>{t("viewMyAttendance")}</strong>
              </span>
              {showWeek ? (
                <LuChevronDown size={18} />
              ) : (
                <LuChevronRight size={18} className={styles.flipRtl} />
              )}
            </button>

            {showWeek && (
              <ul className={styles.weekList}>
                {weekDays.map((day) => {
                  const summary = summarizeDay(records, day, now);
                  return (
                    <li
                      key={day.toISOString()}
                      className={isSameDay(day, now) ? styles.todayRow : ""}
                    >
                      <span className={styles.weekDay}>
                        {day.toLocaleDateString(locale, { weekday: "short", day: "numeric" })}
                      </span>
                      <span className={styles.weekTimes}>
                        {summary.status === "absent"
                          ? "-"
                          : summary.status === "checked-in"
                            ? t("inSince", { time: formatTime(summary.openSince, locale) })
                            : summary.status === "missed-checkout"
                              ? t("noCheckOut")
                              : `${formatTime(summary.firstIn, locale)} – ${formatTime(summary.lastOut, locale)}`}
                      </span>
                      <strong>
                        {summary.status === "absent" ? "" : formatDuration(summary.minutes)}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className={styles.row} aria-live="polite">
              <LuClock size={18} />
              <span className={styles.rowText}>
                <strong>{t("thisWeek")}</strong>
                <span>{weekRange}</span>
              </span>
              <strong className={styles.weekTotal}>{formatDuration(weekTotal)}</strong>
            </div>
          </div>
        </>
      )}
    </>
  );
}
