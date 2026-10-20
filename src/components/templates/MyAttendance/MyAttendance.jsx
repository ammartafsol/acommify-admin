"use client";
import StaffCheckIn from "@/components/organisms/StaffCheckIn/StaffCheckIn";
import {
  addDays,
  formatDuration,
  formatTime,
  formatWeekLabel,
  getWeekDays,
  getWeekRangeParams,
  getWeekStart,
  isCurrentOrFutureWeek,
  isSameDay,
  sessionMinutes,
  sumMinutes,
  summarizeDay,
} from "@/components/templates/StaffAttendance/attendanceUtils";
import weekStyles from "@/components/templates/StaffAttendance/styles.module.css";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { LuCalendarCheck, LuCalendarDays, LuClock, LuTimer, LuUserCheck } from "react-icons/lu";
import styles from "./styles.module.css";

// Day bar covers 6 AM – midnight, widened if a session falls outside it
const BAR_FROM = 6;
const BAR_TO = 24;

export default function MyAttendance() {
  const t = useTranslations("myAttendancePage");
  const locale = useLocale();
  const { Get } = useAxios();

  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [records, setRecords] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const requestId = useRef(0);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const isCurrentWeek = isCurrentOrFutureWeek(weekStart);

  async function getData() {
    const id = ++requestId.current;
    setLoading(true);
    const params = new URLSearchParams(getWeekRangeParams(weekStart)).toString();
    const { response } = await Get({ route: `staff-attendance/me?${params}` });
    if (id !== requestId.current) return;
    if (response) {
      setRecords(Array.isArray(response?.data?.records) ? response.data.records : []);
      setCurrent(response?.data?.current || null);
    }
    setNow(new Date());
    setLoading(false);
  }

  useEffect(() => {
    getData();
  }, [weekStart]);

  // Keep running sessions up to date
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const days = weekDays.map((date) => ({ date, ...summarizeDay(records, date, now) }));
  const weekMinutes = sumMinutes(records, now);
  const daysWorked = days.filter((d) => d.status !== "absent").length;
  const average = daysWorked ? weekMinutes / daysWorked : 0;

  const cards = [
    { icon: <LuClock size={22} />, label: t("cards.thisWeek"), value: formatDuration(weekMinutes) },
    { icon: <LuCalendarCheck size={22} />, label: t("cards.daysWorked"), value: `${daysWorked}/7` },
    { icon: <LuTimer size={22} />, label: t("cards.avgPerDay"), value: formatDuration(average) },
    {
      icon: <LuUserCheck size={22} />,
      label: t("cards.status"),
      value: current
        ? t("statusIn", { time: formatTime(current.checkIn, locale) })
        : t("statusOut"),
      tone: current ? "in" : "out",
    },
  ];

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>

        <div className={weekStyles.weekSelector}>
          <button
            type="button"
            className={weekStyles.weekBtn}
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            aria-label={t("previousWeek")}
          >
            <IoChevronBack size={16} className={weekStyles.flipRtl} />
          </button>
          <button
            type="button"
            className={weekStyles.weekLabel}
            onClick={() => setWeekStart(getWeekStart())}
            title={t("goToCurrentWeek")}
          >
            <LuCalendarDays size={16} />
            <span>{formatWeekLabel(weekStart, locale)}</span>
          </button>
          <button
            type="button"
            className={weekStyles.weekBtn}
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            disabled={isCurrentWeek}
            aria-label={t("nextWeek")}
          >
            <IoChevronForward size={16} className={weekStyles.flipRtl} />
          </button>
        </div>
      </div>

      <div className={styles.cards}>
        {cards.map((card) => (
          <div key={card.label} className={mergeClass(styles.card, card.tone ? styles[card.tone] : "")}>
            <span className={styles.cardIcon}>{card.icon}</span>
            <div>
              <p>{card.label}</p>
              <strong>{loading ? <span className={styles.skeleton} /> : card.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dayList}>
        {days.map((day) => (
          <DayRow
            key={day.date.toISOString()}
            day={day}
            now={now}
            loading={loading}
            locale={locale}
            t={t}
          />
        ))}
      </div>

      {/* Floating check-in button; refresh the page data after a check-in/out */}
      <StaffCheckIn onChange={getData} />
    </Container>
  );
}

function DayRow({ day, now, loading, locale, t }) {
  const isToday = isSameDay(day.date, now);
  const isFuture = day.date > now && !isToday;

  // Widen the bar if a session falls outside 6 AM – midnight
  const dayStart = new Date(day.date);
  const hourOf = (d) => (new Date(d) - dayStart) / 3600000;
  const from = Math.min(BAR_FROM, ...day.sessions.map((s) => Math.floor(hourOf(s.checkIn))));
  const span = BAR_TO - from;
  const pct = (d) => Math.min(100, Math.max(0, ((hourOf(d) - from) / span) * 100));

  return (
    <div className={mergeClass(styles.dayRow, isToday ? styles.todayRow : "")}>
      <div className={styles.dateBlock}>
        <span>{day.date.toLocaleDateString(locale, { weekday: "short" })}</span>
        <strong>{day.date.getDate()}</strong>
        {isToday && <em>{t("today")}</em>}
      </div>

      <div className={styles.dayBody}>
        {loading ? (
          <span className={styles.skeleton} style={{ width: "60%" }} />
        ) : day.status === "absent" ? (
          <p className={styles.muted}>{isFuture ? t("upcoming") : t("noAttendance")}</p>
        ) : (
          <>
            <div className={styles.track}>
              {day.sessions.map((s) => {
                const isMissed = !s.checkOut && s.missedCheckOut;
                const end = s.checkOut || (isMissed ? s.checkIn : now);
                const left = pct(s.checkIn);
                return (
                  <span
                    key={`bar-${s._id || s.checkIn}`}
                    className={mergeClass(
                      styles.segment,
                      !s.checkOut && !isMissed ? styles.segLive : "",
                      isMissed ? styles.segMissed : "",
                    )}
                    style={{
                      insetInlineStart: `${left}%`,
                      width: `${Math.max(1, pct(end) - left)}%`,
                    }}
                  />
                );
              })}
            </div>
            <div className={styles.sessions}>
              {day.sessions.map((s) => {
                const isOpen = !s.checkOut && !s.missedCheckOut;
                const isMissed = !s.checkOut && s.missedCheckOut;
                return (
                  <span
                    key={s._id || s.checkIn}
                    className={mergeClass(
                      styles.chip,
                      isOpen ? styles.chipLive : "",
                      isMissed ? styles.chipMissed : "",
                    )}
                  >
                    <i />
                    {formatTime(s.checkIn, locale)}
                    <b>→</b>
                    {isOpen
                      ? t("inProgress")
                      : isMissed
                        ? t("noCheckOut")
                        : formatTime(s.checkOut, locale)}
                    {!isMissed && (
                      <small>{formatDuration(sessionMinutes(s, now))}</small>
                    )}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className={styles.dayTotal}>
        {!loading && day.status !== "absent" && (
          <>
            <strong>{formatDuration(day.minutes)}</strong>
            <span>{t("sessions", { count: day.sessions.length })}</span>
          </>
        )}
      </div>
    </div>
  );
}
