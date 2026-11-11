"use client";
import {
  addDays,
  getWeekDays,
  getWeekStart,
  isSameDay,
} from "@/components/templates/StaffAttendance/attendanceUtils";
import {
  ENTRY_CODES,
  entryMinutes,
  formatHours,
  isWorking,
  toDayKey,
} from "@/components/templates/StaffRostering/rosterUtils";
import useAxios from "@/interceptor/axios-functions";
import { mergeClass } from "@/resources/utils/helper";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import DayOffRequests from "./DayOffRequests";
import { describeEntry } from "@/components/templates/StaffRostering/RosterHistoryModal";
import styles from "./StaffCheckIn.module.css";

/** The staff member's own issued roster, one week at a time. */
export default function MyRoster({ locale, t }) {
  const { Get } = useAxios();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const [requests, setRequests] = useState([]);
  const [issuedWeeks, setIssuedWeeks] = useState(null);
  const [showPrevious, setShowPrevious] = useState(false);

  async function loadIssuedWeeks() {
    const { response } = await Get({ route: "staff-roster/me/issued", showAlert: false });
    setIssuedWeeks(Array.isArray(response?.data) ? response.data : []);
  }

  async function loadRequests() {
    const { response } = await Get({ route: "staff-roster/requests/me", showAlert: false });
    setRequests(Array.isArray(response?.data) ? response.data : []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const weekKey = toDayKey(weekStart);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = new Date();

  useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    Get({
      route: `staff-roster/me?weekStart=${weekKey}`,
      showAlert: false,
    }).then(({ response }) => {
      if (current !== requestId.current) return;
      setData(response?.data || null);
      setLoading(false);
    });
  }, [weekKey]);

  const byDay = (data?.entries || []).reduce((map, e) => {
    map[e.date] = e;
    return map;
  }, {});
  const requestByDay = Object.fromEntries(requests.map((r) => [r.date, r]));
  const changedDays = new Set(data?.changedDates || []);
  const previousByDay = Object.fromEntries((data?.previousEntries || []).map((e) => [e.date, e]));
  const holidayByDay = Object.fromEntries((data?.holidays || []).map((h) => [h.date, h]));
  const total = Object.values(byDay).reduce(
    (sum, e) => sum + entryMinutes(e),
    0,
  );

  const range = `${weekStart.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })} – ${addDays(weekStart, 6).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })}`;

  return (
    <div className={styles.roster}>
      <div className={styles.rosterNav}>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          aria-label={t("previousWeek")}
        >
          <IoChevronBack size={16} className={styles.flipRtl} />
        </button>
        <span>
          <strong>{range}</strong>
          {data?.issued && (
            <em>
              {t("rosterIssuedAt", {
                date: new Date(data.issuedAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                }),
              })}
            </em>
          )}
          {data?.updated && (
            <em className={styles.updatedBadge}>{t("rosterUpdated")}</em>
          )}
        </span>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          aria-label={t("nextWeek")}
        >
          <IoChevronForward size={16} className={styles.flipRtl} />
        </button>
      </div>

      {loading ? (
        <div className={styles.rosterLoading}>
          <Spinner size="sm" />
        </div>
      ) : !data?.issued ? (
        <p className={styles.weekEmpty}>{t("rosterNotIssued")}</p>
      ) : (
        <>
          <div className={styles.dayCards}>
            {weekDays.map((day) => {
              const entry = byDay[toDayKey(day)];
              const works = isWorking(entry);
              return (
                <div
                  key={toDayKey(day)}
                  className={mergeClass(
                    styles.dayCard,
                    isSameDay(day, today) ? styles.dayCardToday : "",
                    changedDays.has(toDayKey(day)) ? styles.dayCardChanged : "",
                  )}
                >
                  <div className={styles.dayBadge}>
                    <span>
                      {day.toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                    <strong>{day.getDate()}</strong>
                  </div>
                  <div className={styles.rosterDay}>
                    {works ? (
                      <strong>
                        {entry.startTime} – {entry.endTime}
                      </strong>
                    ) : entry ? (
                      <b
                        className={mergeClass(
                          styles.rosterCode,
                          styles[`rc_${entry.type}`],
                        )}
                      >
                        {ENTRY_CODES[entry.type]}
                      </b>
                    ) : (
                      <span>{t("rosterNoShift")}</span>
                    )}
                    {entry && !works && (
                      <span>
                        {entry.type === "ro"
                          ? t(
                              entry.roDecision === "approved"
                                ? "rosterRoApproved"
                                : "rosterRoDeclined",
                            )
                          : t(`rosterCodes.${entry.type}`)}
                      </span>
                    )}
                    {works && entry.breakMinutes > 0 && (
                      <span>
                        {t("rosterBreak", { minutes: entry.breakMinutes })}
                      </span>
                    )}
                    {entry?.note && (
                      <span className={styles.rosterNote}>{entry.note}</span>
                    )}
                    {changedDays.has(toDayKey(day)) && (
                      <span className={styles.changedLine}>
                        {t("rosterChangedWas", {
                          was: describeEntry(previousByDay[toDayKey(day)]),
                        })}
                      </span>
                    )}
                    {holidayByDay[toDayKey(day)] && (
                      <span className={styles.holidayLine}>
                        {holidayByDay[toDayKey(day)].type === "bank-holiday" ? "B/HOL" : "HOL"} ·{" "}
                        {holidayByDay[toDayKey(day)].name?.[locale] ||
                          holidayByDay[toDayKey(day)].name?.en}
                      </span>
                    )}
                    {requestByDay[toDayKey(day)] &&
                      !(entry?.type === "ro" && entry.roDecision === "approved") && (
                        <span
                          className={mergeClass(
                            styles.requestTag,
                            styles[`requestTag_${requestByDay[toDayKey(day)].status}`],
                          )}
                        >
                          {t(`requests.dayTag.${requestByDay[toDayKey(day)].status}`)}
                        </span>
                      )}
                  </div>
                  <span className={styles.dayHours}>
                    {works ? formatHours(entryMinutes(entry)) : "-"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.rosterTotal}>
            <span>{t("rosterScheduled")}</span>
            <strong>{formatHours(total)}</strong>
          </div>
        </>
      )}

      <button
        type="button"
        className={styles.previousToggle}
        onClick={() => {
          if (!showPrevious && !issuedWeeks) loadIssuedWeeks();
          setShowPrevious((v) => !v);
        }}
        aria-expanded={showPrevious}
      >
        {t("previousRosters")}
        <IoChevronForward
          size={14}
          className={mergeClass(styles.flipRtl, showPrevious ? styles.rotated : "")}
        />
      </button>
      {showPrevious && (
        <ul className={styles.previousList}>
          {!issuedWeeks ? (
            <li className={styles.previousEmpty}>
              <Spinner size="sm" />
            </li>
          ) : !issuedWeeks.length ? (
            <li className={styles.previousEmpty}>{t("noPreviousRosters")}</li>
          ) : (
            issuedWeeks.map((w) => {
              const [y, m, d] = w.weekStart.split("-").map(Number);
              const start = new Date(y, m - 1, d);
              return (
                <li key={w.weekStart}>
                  <button
                    type="button"
                    className={w.weekStart === weekKey ? styles.previousActive : ""}
                    onClick={() => setWeekStart(start)}
                  >
                    <span>
                      {start.toLocaleDateString(locale, { day: "numeric", month: "short" })} –{" "}
                      {addDays(start, 6).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {w.updated && <em className={styles.updatedBadge}>{t("rosterUpdated")}</em>}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}

      <DayOffRequests
        weekDays={weekDays}
        requests={requests}
        onChanged={loadRequests}
        locale={locale}
        t={t}
      />
    </div>
  );
}
