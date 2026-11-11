"use client";
import RenderToast from "@/components/atoms/RenderToast";
import {
  formatDuration,
  formatTime,
  getWeekRangeParams,
  getWeekStart,
  addDays,
  openBreak,
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
import {
  LuCalendarCheck,
  LuCalendarDays,
  LuChevronDown,
  LuChevronRight,
  LuClock,
  LuCoffee,
  LuPlay,
} from "react-icons/lu";
import { Link } from "@/i18n/navigation";
import MyAttendance from "./MyAttendance";
import MyRoster from "./MyRoster";
import styles from "./StaffCheckIn.module.css";

/** Floating check-in button + panel for staff. `onChange` runs after a check-in/out. */
export default function StaffCheckIn({ onChange }) {
  const t = useTranslations("staffCheckIn");
  const locale = useLocale();
  const { Get, Post } = useAxios();

  const [open, setOpen] = useState(false);
  const [showWeek, setShowWeek] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [current, setCurrent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState("loading");

  const weekStart = useMemo(() => getWeekStart(now), [now.toDateString()]);

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

  // Clock actions, in the order of a shift
  const ACTIONS = {
    clockIn: { route: "check-in", toast: "clockedInToast" },
    lunchOut: { route: "break/start", toast: "lunchStartedToast" },
    lunchReturn: { route: "break/end", toast: "lunchEndedToast" },
    endShift: { route: "check-out", toast: "shiftEndedToast" },
  };

  async function run(action) {
    setLoading(action);
    const { response } = await Post({ route: `staff-attendance/${ACTIONS[action].route}` });
    if (response) RenderToast({ type: "success", message: t(ACTIONS[action].toast) });
    setConfirmEnd(false);
    // Refresh either way so the panel matches the server (e.g. clocked in elsewhere)
    await getMyAttendance();
    onChange?.();
    setLoading("");
  }

  const today = summarizeDay(records, now, now);
  const weekTotal = sumMinutes(records, now);
  const isCheckedIn = Boolean(current);
  const runningBreak = openBreak(current);
  const finishedLunch = current?.breaks?.find((b) => b.end);
  // idle → working → lunch → afterLunch → complete (one shift a day)
  const phase = runningBreak
    ? "lunch"
    : isCheckedIn
      ? finishedLunch
        ? "afterLunch"
        : "working"
      : today.sessions.some((s) => s.checkOut)
        ? "complete"
        : "idle";

  let statusTitle = t("notClockedIn");
  let statusText = t("readyToStart");
  let statusTone = "idle";
  if (phase === "lunch") {
    statusTitle = t("onLunchSince", { time: formatTime(runningBreak.start, locale) });
    statusText = t("lunchTimer", {
      minutes: Math.max(0, Math.floor((now - new Date(runningBreak.start)) / 60000)),
      hours: formatDuration(today.minutes),
    });
    statusTone = "break";
  } else if (phase === "working") {
    statusTitle = t("clockedInSince", { time: formatTime(current.checkIn, locale) });
    statusText = t("workedToday", { hours: formatDuration(today.minutes) });
    statusTone = "in";
  } else if (phase === "afterLunch") {
    statusTitle = t("backFromLunch", { time: formatTime(finishedLunch.end, locale) });
    statusText = t("workedToday", { hours: formatDuration(today.minutes) });
    statusTone = "in";
  } else if (phase === "complete") {
    statusTitle = t("shiftComplete");
    statusText = t("shiftCompleteText", {
      in: formatTime(today.firstIn, locale),
      out: formatTime(today.lastOut, locale),
      hours: formatDuration(today.minutes),
    });
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
                {today.breakMinutes > 0 && phase !== "lunch" && (
                  <span className={styles.breakToday}>
                    {t("lunchToday", { hours: formatDuration(today.breakMinutes) })}
                  </span>
                )}
              </div>
            </div>

            {phase === "idle" && (
              <button
                type="button"
                className={styles.primary}
                onClick={() => run("clockIn")}
                disabled={loading !== ""}
              >
                {loading === "clockIn" ? <Spinner size="sm" /> : t("clockIn")}
              </button>
            )}

            {phase === "working" && (
              <button
                type="button"
                className={styles.breakBtn}
                onClick={() => run("lunchOut")}
                disabled={loading !== ""}
              >
                {loading === "lunchOut" ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <LuCoffee size={18} />
                    {t("lunchOut")}
                  </>
                )}
              </button>
            )}

            {phase === "lunch" && (
              <>
                <button
                  type="button"
                  className={mergeClass(styles.breakBtn, styles.breakBtnEnd)}
                  onClick={() => run("lunchReturn")}
                  disabled={loading !== ""}
                >
                  {loading === "lunchReturn" ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <LuPlay size={18} />
                      {t("lunchReturn")}
                    </>
                  )}
                </button>
                <p className={styles.phaseNote}>{t("returnFirst")}</p>
              </>
            )}

            {(phase === "working" || phase === "afterLunch") &&
              (confirmEnd ? (
                <div className={styles.confirmEnd} role="alertdialog" aria-label={t("endConfirmTitle")}>
                  <strong>{t("endConfirmTitle")}</strong>
                  <span>
                    {phase === "working" ? t("endConfirmNoLunch") : t("endConfirmText")}
                  </span>
                  <div>
                    <button type="button" className={styles.confirmCancel} onClick={() => setConfirmEnd(false)}>
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      className={styles.confirmYes}
                      onClick={() => run("endShift")}
                      disabled={loading !== ""}
                    >
                      {loading === "endShift" ? <Spinner size="sm" /> : t("endConfirmYes")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={mergeClass(
                    styles.primary,
                    styles.checkOut,
                    phase === "working" ? styles.endSecondary : "",
                  )}
                  onClick={() => setConfirmEnd(true)}
                  disabled={loading !== ""}
                >
                  {t("endShift")}
                </button>
              ))}

            {phase === "complete" && <p className={styles.phaseDone}>{t("noMoreActions")}</p>}

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
              <MyAttendance
                locale={locale}
                t={t}
                now={now}
                // reload after a clock action so the week view stays in sync
                refreshKey={`${records.length}-${current?._id || ""}-${current?.breaks?.length || 0}-${
                  today.lastOut || ""
                }`}
              />
            )}

            <Link
              href="/my-attendance"
              className={styles.viewAll}
              onClick={() => setOpen(false)}
            >
              {t("myAtt.viewAll")}
              <LuChevronRight size={16} className={styles.flipRtl} />
            </Link>

            <button
              type="button"
              className={styles.row}
              onClick={() => setShowRoster((v) => !v)}
              aria-expanded={showRoster}
            >
              <LuCalendarDays size={18} />
              <span className={styles.rowText}>
                <strong>{t("myRoster")}</strong>
                <span>{t("myRosterHint")}</span>
              </span>
              {showRoster ? (
                <LuChevronDown size={18} />
              ) : (
                <LuChevronRight size={18} className={styles.flipRtl} />
              )}
            </button>

            {showRoster && <MyRoster locale={locale} t={t} />}

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
