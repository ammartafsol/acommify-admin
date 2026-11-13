"use client";

import Button from "@/components/atoms/Button";
import ModalSkeleton from "@/components/organisms/Modals/ModalSkeleton/ModalSkeleton";
import { useMemo } from "react";
import { LuTriangleAlert, LuRefreshCw } from "react-icons/lu";
import {
  ENTRY_CODES,
  cleanEntry,
  entryKey,
  entryMinutes,
  formatHours,
  isWorking,
} from "./rosterUtils";
import styles from "./review.module.css";

const sig = (e) =>
  e ? JSON.stringify([e.type, e.startTime, e.endTime, e.breakMinutes, e.roDecision]) : "";

/**
 * Review the whole week before it is issued (PDF §3: "Managers should be able
 * to review the entire roster before publishing it"). Read only: every staff
 * member × day, hours per person, code counts and anything worth a second look.
 */
export default function RosterReviewModal({
  show,
  setShow,
  t,
  locale,
  staff,
  entries,
  issuedEntries,
  isIssued,
  weekDays,
  dayKeys,
  holidays,
  weekLabel,
  staffName,
  onIssue,
  loading,
}) {
  const holidayByDay = Object.fromEntries((holidays || []).map((h) => [h.date, h]));

  const issuedByKey = useMemo(() => {
    const map = {};
    (issuedEntries || []).forEach((e) => {
      const c = cleanEntry(e);
      map[entryKey(c.staff, c.date)] = c;
    });
    return map;
  }, [issuedEntries]);

  const rows = staff.map((s) => {
    const id = String(s._id);
    const cells = dayKeys.map((day) => entries[entryKey(id, day)] || null);
    const minutes = cells.reduce((n, e) => n + entryMinutes(e), 0);
    const changed =
      isIssued &&
      dayKeys.some((day) => sig(entries[entryKey(id, day)]) !== sig(issuedByKey[entryKey(id, day)]));
    return { s, id, cells, minutes, empty: cells.every((c) => !c), changed };
  });

  const all = rows.flatMap((r) => r.cells).filter(Boolean);
  const count = (type) => all.filter((e) => e.type === type).length;
  const totals = {
    staff: rows.filter((r) => !r.empty).length,
    minutes: rows.reduce((n, r) => n + r.minutes, 0),
    shifts: all.filter(isWorking).length,
    ro: count("ro"),
    hol: count("hol"),
    bhol: count("bhol"),
    off: count("off"),
  };
  const notOnRoster = rows.filter((r) => r.empty);
  const changed = rows.filter((r) => r.changed);

  const cellText = (e) => {
    if (!e) return "—";
    if (isWorking(e)) return `${e.startTime}–${e.endTime}`;
    return ENTRY_CODES[e.type] || e.type;
  };

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      maxWidth="1180px"
      padding="20px 24px"
      header={t("review.title")}
    >
      <div className={styles.wrap} data-testid="roster-review">
        <p className={styles.intro}>{t("review.intro", { week: weekLabel })}</p>

        <div className={styles.stats}>
          <div>
            <span>{t("review.staffOnRoster")}</span>
            <strong data-stat="staff">{totals.staff}</strong>
          </div>
          <div>
            <span>{t("review.shifts")}</span>
            <strong data-stat="shifts">{totals.shifts}</strong>
          </div>
          <div>
            <span>{t("review.plannedHours")}</span>
            <strong data-stat="hours">{formatHours(totals.minutes)}</strong>
          </div>
          <div>
            <span>{t("review.codes")}</span>
            <strong className={styles.codes} data-stat="codes">
              R/O {totals.ro} · HOL {totals.hol} · B/HOL {totals.bhol} · OFF {totals.off}
            </strong>
          </div>
        </div>

        {notOnRoster.length ? (
          <p className={styles.warn} data-testid="review-not-on-roster">
            <LuTriangleAlert size={16} />
            {t("review.notOnRoster", {
              count: notOnRoster.length,
              names: notOnRoster.map((r) => staffName(r.s)).join(", "),
            })}
          </p>
        ) : null}
        {changed.length ? (
          <p className={styles.info} data-testid="review-changed">
            <LuRefreshCw size={16} />
            {t("review.changed", {
              count: changed.length,
              names: changed.map((r) => staffName(r.s)).join(", "),
            })}
          </p>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("review.staff")}</th>
                {weekDays.map((d, i) => (
                  <th key={dayKeys[i]}>
                    {d.toLocaleDateString(locale, { weekday: "short" })}
                    <em>{d.toLocaleDateString(locale, { day: "numeric", month: "short" })}</em>
                    {holidayByDay[dayKeys[i]] ? (
                      <b className={styles.hol}>
                        {holidayByDay[dayKeys[i]].type === "bank-holiday" ? "B/HOL" : "HOL"}
                      </b>
                    ) : null}
                  </th>
                ))}
                <th>{t("review.total")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  data-staff={r.id}
                  className={[r.changed ? styles.changedRow : "", r.empty ? styles.emptyRow : ""].join(" ")}
                >
                  <td className={styles.name}>
                    {staffName(r.s)}
                    {r.changed ? <span className={styles.badge}>{t("review.updated")}</span> : null}
                  </td>
                  {r.cells.map((e, i) => (
                    <td
                      key={dayKeys[i]}
                      className={e ? styles[`c_${isWorking(e) ? "shift" : e.type}`] || "" : styles.c_none}
                    >
                      {cellText(e)}
                      {isWorking(e) ? <em>{formatHours(entryMinutes(e))}</em> : null}
                      {e?.type === "ro" && e.roDecision ? (
                        <em>{t(`review.ro.${e.roDecision}`)}</em>
                      ) : null}
                    </td>
                  ))}
                  <td className={styles.total}>{r.minutes ? formatHours(r.minutes) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <Button label={t("review.back")} variant="outlined" onClick={() => setShow(false)} />
          <Button
            label={isIssued ? t("review.reissue") : t("review.issue")}
            variant="primary"
            onClick={onIssue}
            disabled={loading}
            loading={loading}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
