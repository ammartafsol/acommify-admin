"use client";
import { useMyAttendanceData } from "@/components/organisms/StaffCheckIn/MyAttendance";
import {
  addDays,
  breakMinutes,
  dayKeyOf,
  formatDuration,
  formatTime,
  isSameDay,
} from "@/components/templates/StaffAttendance/attendanceUtils";
import { ENTRY_CODES, entryMinutes, isWorking } from "@/components/templates/StaffRostering/rosterUtils";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import {
  LuCalendarCheck,
  LuCalendarClock,
  LuCalendarDays,
  LuClock,
  LuCoffee,
  LuLock,
  LuLogIn,
  LuLogOut,
  LuPencilLine,
  LuTarget,
  LuTrendingDown,
  LuTrendingUp,
  LuTriangleAlert,
} from "react-icons/lu";
import { useSelector } from "react-redux";
import styles from "./styles.module.css";

// The day timeline runs 06:00 → 24:00, wider when a shift starts earlier
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 24;
const minutesOfDay = (d, base) => (new Date(d) - base) / 60000;
const hm = (time) => {
  const [h, m] = (time || "0:0").split(":").map(Number);
  return h * 60 + m;
};

/** One status chip per day: what happened compared with the roster. */
function dayStatus(day, now, t) {
  if (day.flags.length) return { tone: "danger", label: t("myAtt.status.missing") };
  if (day.status === "checked-in")
    return day.onBreakSince
      ? { tone: "warning", label: t("myAtt.status.onLunch") }
      : { tone: "live", label: t("myAtt.status.working") };
  const corrected = day.sessions.some((s) => s.manual || s.corrections?.length);
  if (day.status !== "absent") {
    if (corrected) return { tone: "purple", label: t("myAtt.status.corrected") };
    // Worked without a rostered shift: just the hours, no label
    if (!day.planned) return null;
    const gap = day.minutes - day.planned;
    if (gap >= -15) return { tone: "success", label: t("myAtt.status.onTarget") };
    return { tone: "warning", label: t("myAtt.status.short", { hours: formatDuration(-gap) }) };
  }
  const s = day.scheduled;
  if (s && !isWorking(s)) return { tone: "muted", label: `${ENTRY_CODES[s.type]} · ${t(`myAtt.codes.${s.type}`)}` };
  if (s) return { tone: "muted", label: t("myAtt.status.upcoming") };
  return { tone: "muted", label: t("myAtt.noShift") };
}

/** Staff: their own attendance on a full page (read only). */
export default function MyAttendancePage() {
  const t = useTranslations("staffCheckIn");
  const locale = useLocale();
  const { user } = useSelector((state) => state.authReducer);
  const [now, setNow] = useState(() => new Date());

  // Keep durations of a running shift / lunch up to date
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (user?.role !== "staff")
    return (
      <Container className={mergeClass("containerFluid", styles.main)}>
        <p className={styles.notStaff}>{t("myAtt.staffOnly")}</p>
      </Container>
    );

  return <Dashboard t={t} locale={locale} now={now} user={user} />;
}

function Dashboard({ t, locale, now, user }) {
  const data = useMyAttendanceData(now);
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
  } = data;

  const name = user?.fullName?.[locale] || user?.fullName?.en || "";
  const progress = plannedMinutes ? Math.min(100, Math.round((totalMinutes / plannedMinutes) * 100)) : 0;
  const range = `${weekStart.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${addDays(
    weekStart,
    6,
  ).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
  const scale = Math.max(8 * 60, ...days.map((d) => Math.max(d.minutes, d.planned)));

  // Timeline scale for the week (earliest start / latest end)
  const startHour = Math.min(
    DAY_START_HOUR,
    ...days.flatMap((d) => [
      ...d.sessions.map((s) => new Date(s.checkIn).getHours()),
      ...(d.scheduled?.startTime ? [Math.floor(hm(d.scheduled.startTime) / 60)] : []),
    ]),
  );
  const span = (DAY_END_HOUR - startHour) * 60;
  const pos = (min) => `${Math.max(0, Math.min(100, ((min - startHour * 60) / span) * 100))}%`;
  const width = (from, to) => `${Math.max(0.8, ((Math.min(to, DAY_END_HOUR * 60) - from) / span) * 100)}%`;
  const ticks = [];
  for (let h = Math.ceil(startHour / 3) * 3; h <= DAY_END_HOUR; h += 3) ticks.push(h);

  const stats = [
    { icon: LuCalendarCheck, tone: "blue", label: t("myAtt.daysWorked"), value: worked.length },
    { icon: LuClock, tone: "green", label: t("myAtt.hoursWorked"), value: formatDuration(totalMinutes) },
    { icon: LuTarget, tone: "navy", label: t("myAtt.planned"), value: plannedMinutes ? formatDuration(plannedMinutes) : "-" },
    {
      icon: diff < 0 ? LuTrendingDown : LuTrendingUp,
      tone: !plannedMinutes ? "grey" : diff < 0 ? "orange" : "teal",
      label: t("myAtt.difference"),
      value: plannedMinutes ? `${diff < 0 ? "−" : "+"}${formatDuration(Math.abs(diff))}` : "-",
    },
    { icon: LuCoffee, tone: "amber", label: t("myAtt.lunchTaken"), value: formatDuration(lunchMinutes) },
    {
      icon: LuCalendarDays,
      tone: "purple",
      label: monthStart.toLocaleDateString(locale, { month: "long", year: "numeric" }),
      value: formatDuration(monthMinutes),
      hint: t("myAtt.monthDays", { days: monthDays }),
    },
  ];

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      {/* ---------- Hero ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <span className={styles.eyebrow}>{t("myAtt.pageTitle")}</span>
            <h1>{name ? t("myAtt.hello", { name: name.split(" ")[0] }) : t("myAtt.pageTitle")}</h1>
            <p>{t("myAtt.pageSubtitle")}</p>
          </div>
          <div className={styles.weekNav}>
            <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label={t("previousWeek")}>
              <IoChevronBack size={18} className={styles.flipRtl} />
            </button>
            <div>
              <strong>{range}</strong>
              <span>{isCurrentWeek ? t("myAtt.thisWeek") : t("myAtt.pastWeek")}</span>
            </div>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              disabled={isCurrentWeek}
              aria-label={t("nextWeek")}
            >
              <IoChevronForward size={18} className={styles.flipRtl} />
            </button>
          </div>
        </div>

        {(user?.shiftStart || user?.shiftEnd) && (
          <div className={styles.assignedTiming}>
            <LuCalendarClock size={16} />
            <span>
              {t("myAtt.profileTiming", {
                from: user.shiftStart || "--:--",
                to: user.shiftEnd || "--:--",
              })}
            </span>
          </div>
        )}

        <div className={styles.progress}>
          <div className={styles.progressText}>
            <strong>{formatDuration(totalMinutes)}</strong>
            <span>
              {plannedMinutes
                ? t("myAtt.ofPlanned", { hours: formatDuration(plannedMinutes), percent: progress })
                : t("myAtt.noRoster")}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <span style={{ width: `${plannedMinutes ? progress : 0}%` }} />
          </div>
        </div>
      </section>

      {loading ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : (
        <>
          {/* ---------- Stats ---------- */}
          <section className={styles.stats}>
            {stats.map(({ icon: Icon, tone, label, value, hint }) => (
              <div key={label} className={mergeClass(styles.stat, styles[`tone_${tone}`])}>
                <span className={styles.statIcon}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className={styles.statLabel}>{label}</span>
                  <strong>{value}</strong>
                  {hint && <span className={styles.statHint}>{hint}</span>}
                </div>
              </div>
            ))}
          </section>

          {/* ---------- Week chart ---------- */}
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2>{t("myAtt.weekAtGlance")}</h2>
              <div className={styles.legend}>
                <span>
                  <i className={styles.lgWorked} /> {t("myAtt.legendWorked")}
                </span>
                <span>
                  <i className={styles.lgPlanned} /> {t("myAtt.legendPlanned")}
                </span>
                <span>
                  <i className={styles.lgMissing} /> {t("myAtt.legendMissing")}
                </span>
              </div>
            </header>
            <div className={styles.chart}>
              {days.map((d) => {
                const today = isSameDay(d.date, now);
                return (
                  <div key={dayKeyOf(d.date)} className={mergeClass(styles.col, today ? styles.colToday : "")}>
                    <span className={styles.colValue}>{d.minutes ? formatDuration(d.minutes) : ""}</span>
                    <div className={styles.colTrack}>
                      {d.planned > 0 && (
                        <span className={styles.colPlanned} style={{ height: `${(d.planned / scale) * 100}%` }} />
                      )}
                      <span
                        className={mergeClass(
                          styles.colBar,
                          d.flags.length ? styles.colBarMissing : "",
                          d.status === "checked-in" ? styles.colBarLive : "",
                        )}
                        style={{ height: `${d.minutes ? Math.max(4, (d.minutes / scale) * 100) : 0}%` }}
                      />
                    </div>
                    <span className={styles.colDay}>{d.date.toLocaleDateString(locale, { weekday: "short" })}</span>
                    <span className={styles.colDate}>{d.date.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------- Daily timeline ---------- */}
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2>{t("myAtt.dailyRecord")}</h2>
              <div className={styles.legend}>
                <span>
                  <i className={styles.lgWorked} /> {t("myAtt.legendWorked")}
                </span>
                <span>
                  <i className={styles.lgLunch} /> {t("myAtt.legendLunch")}
                </span>
                <span>
                  <i className={styles.lgShift} /> {t("myAtt.legendShift")}
                </span>
              </div>
            </header>

            <div className={styles.scale} aria-hidden>
              <span />
              <div>
                {ticks.map((h) => (
                  <i key={h} style={{ insetInlineStart: pos(h * 60) }}>
                    {String(h % 24).padStart(2, "0")}:00
                  </i>
                ))}
              </div>
              <span />
            </div>

            <ol className={styles.timeline}>
              {days.map((d) => {
                const base = new Date(d.date);
                base.setHours(0, 0, 0, 0);
                const status = dayStatus(d, now, t);
                const s = d.scheduled;
                const today = isSameDay(d.date, now);
                const empty = !d.sessions.length && !(s && isWorking(s));
                return (
                  <li
                    key={dayKeyOf(d.date)}
                    className={mergeClass(
                      styles.dayRow,
                      today ? styles.dayToday : "",
                      empty ? styles.dayEmpty : "",
                    )}
                  >
                    <div className={styles.dayBadge}>
                      <span>{d.date.toLocaleDateString(locale, { weekday: "short" })}</span>
                      <strong>{d.date.getDate()}</strong>
                    </div>

                    <div className={styles.dayMain}>
                      <div className={styles.bar}>
                        {ticks.map((h) => (
                          <i key={h} className={styles.gridLine} style={{ insetInlineStart: pos(h * 60) }} />
                        ))}
                        {s && isWorking(s) && (
                          <span
                            className={styles.shiftOutline}
                            style={{
                              insetInlineStart: pos(hm(s.startTime)),
                              width: width(hm(s.startTime), hm(s.endTime) > hm(s.startTime) ? hm(s.endTime) : 24 * 60),
                            }}
                            title={t("myAtt.assignedShift", {
                              from: s.startTime,
                              to: s.endTime,
                              hours: formatDuration(entryMinutes(s)),
                            })}
                          >
                            <b>
                              {s.startTime}–{s.endTime}
                            </b>
                          </span>
                        )}
                        {d.sessions.map((r) => {
                          const from = minutesOfDay(r.checkIn, base);
                          const to = r.checkOut
                            ? minutesOfDay(r.checkOut, base)
                            : r.missedCheckOut
                              ? from + 20
                              : minutesOfDay(now, base);
                          return (
                            <span key={r._id || r.checkIn}>
                              <span
                                className={mergeClass(
                                  styles.workSeg,
                                  !r.checkOut && !r.missedCheckOut ? styles.workLive : "",
                                  r.missedCheckOut && !r.checkOut ? styles.workMissing : "",
                                )}
                                style={{ insetInlineStart: pos(from), width: width(from, to) }}
                              />
                              {(r.breaks || []).map((b) => {
                                const bf = minutesOfDay(b.start, base);
                                const bt = b.end ? minutesOfDay(b.end, base) : r.checkOut ? to : minutesOfDay(now, base);
                                return (
                                  <span
                                    key={b.start}
                                    className={styles.lunchSeg}
                                    style={{ insetInlineStart: pos(bf), width: width(bf, bt) }}
                                  />
                                );
                              })}
                            </span>
                          );
                        })}
                      </div>

                      <div className={styles.miniScale} aria-hidden>
                        {[startHour, Math.round((startHour + DAY_END_HOUR) / 2), DAY_END_HOUR].map((h) => (
                          <span key={h}>{String(h % 24).padStart(2, "0")}:00</span>
                        ))}
                      </div>

                      <div className={styles.details}>
                        {d.sessions.map((r) => (
                          <span key={r._id || r.checkIn} className={styles.detailLine}>
                            <span className={styles.pill}>
                              <LuLogIn size={13} /> {formatTime(r.checkIn, locale)}
                            </span>
                            {(r.breaks || []).map((b) => (
                              <span key={b.start} className={mergeClass(styles.pill, styles.pillLunch)}>
                                <LuCoffee size={13} /> {formatTime(b.start, locale)} –{" "}
                                {b.end ? formatTime(b.end, locale) : "?"} ·{" "}
                                {formatDuration(breakMinutes({ ...r, breaks: [b] }, now))}
                              </span>
                            ))}
                            <span className={styles.pill}>
                              <LuLogOut size={13} />{" "}
                              {r.checkOut ? formatTime(r.checkOut, locale) : r.missedCheckOut ? "?" : t("inProgress")}
                            </span>
                          </span>
                        ))}
                        {s && isWorking(s) && (
                          <span className={styles.assigned}>
                            <LuCalendarClock size={13} />
                            {t("myAtt.assignedShift", {
                              from: s.startTime,
                              to: s.endTime,
                              hours: formatDuration(entryMinutes(s)),
                            })}
                            {s.breakMinutes > 0 && (
                              <em>{t("myAtt.assignedBreak", { minutes: s.breakMinutes })}</em>
                            )}
                          </span>
                        )}
                        {d.flags.map((f) => (
                          <span key={f} className={styles.flag}>
                            <LuTriangleAlert size={12} /> {t(`myAtt.flags.${f}`)}
                          </span>
                        ))}
                        {d.sessions.flatMap((r) =>
                          (r.corrections || []).map((c, i) => (
                            <span key={`${r._id}-${i}`} className={styles.correction}>
                              <LuPencilLine size={12} />
                              {t("myAtt.correctedBy", {
                                name: c.correctedBy?.fullName?.[locale] || c.correctedBy?.fullName?.en || "-",
                              })}
                              {c.reason ? ` · “${c.reason}”` : ""}
                            </span>
                          )),
                        )}
                      </div>
                    </div>

                    <div className={styles.dayEnd}>
                      <strong>{d.minutes ? formatDuration(d.minutes) : "–"}</strong>
                      {status && (
                        <span className={mergeClass(styles.chip, styles[`chip_${status.tone}`])}>{status.label}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <p className={styles.readOnly}>
            <LuLock size={14} /> {t("myAtt.readOnly")}
          </p>
        </>
      )}
    </Container>
  );
}
