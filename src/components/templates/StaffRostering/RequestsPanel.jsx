"use client";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { LuCalendarX2, LuCheck, LuX } from "react-icons/lu";
import styles from "./RequestsPanel.module.css";

/** "Wed 11 Nov" for a 'YYYY-MM-DD' day (no time-zone shift). */
export function formatRequestDay(day, locale) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Staff day-off (R/O) requests for the week. Managers approve or decline each
 * one; pending requests block issuing the roster.
 */
export default function RequestsPanel({ requests, staffName, canManage, busyId, onReview, currentUserId }) {
  const t = useTranslations("staffRosterPage");
  const locale = useLocale();
  const [declining, setDeclining] = useState(null); // request id
  const [note, setNote] = useState("");

  if (!requests.length) return null;
  const pending = requests.filter((r) => r.status === "pending");
  // Pending first, then by day
  const sorted = [...requests].sort(
    (a, b) =>
      (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) ||
      a.date.localeCompare(b.date),
  );

  return (
    <section className={mergeClass(styles.panel, pending.length ? styles.hasPending : "")}>
      <header className={styles.header}>
        <span className={styles.icon}>
          <LuCalendarX2 size={20} />
        </span>
        <div>
          <h2>
            {t("requests.title")}
            {pending.length > 0 && <b className={styles.count}>{pending.length}</b>}
          </h2>
          <p>{pending.length ? t("requests.subtitle") : t("requests.allReviewed")}</p>
        </div>
      </header>

      <ul className={styles.list}>
        {sorted.map((r) => {
          const isPending = r.status === "pending";
          const busy = busyId === r._id;
          return (
            <li key={r._id} className={mergeClass(styles.item, isPending ? styles.itemPending : "")}>
              <div className={styles.info}>
                <strong>{staffName(r.staff)}</strong>
                <span className={styles.day}>{formatRequestDay(r.date, locale)}</span>
                <span className={styles.reason}>{r.reason ? `“${r.reason}”` : t("requests.noReason")}</span>
                {!isPending && (
                  <span className={styles.reviewed}>
                    {r.status === "approved" ? t("requests.approvedBy") : t("requests.declinedBy")}{" "}
                    {r.reviewedBy?.fullName?.[locale] || r.reviewedBy?.fullName?.en || ""}
                    {r.responseNote ? ` · ${r.responseNote}` : ""}
                  </span>
                )}
              </div>

              {isPending && canManage && String(r.staff) === String(currentUserId) ? (
                // Nobody reviews their own day off
                <span className={styles.selfNote}>{t("requests.ownRequest")}</span>
              ) : isPending && canManage ? (
                declining === r._id ? (
                  <div className={styles.declineBox}>
                    <input
                      autoFocus
                      value={note}
                      maxLength={300}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("requests.declineNote")}
                      aria-label={t("requests.declineNote")}
                    />
                    <div className={styles.actions}>
                      <button type="button" className={styles.ghost} onClick={() => setDeclining(null)}>
                        {t("editor.cancel")}
                      </button>
                      <button
                        type="button"
                        className={styles.decline}
                        disabled={busy}
                        onClick={async () => {
                          await onReview(r, "declined", note);
                          setDeclining(null);
                          setNote("");
                        }}
                      >
                        {busy ? <Spinner size="sm" /> : t("requests.confirmDecline")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.decline}
                      disabled={busy}
                      onClick={() => {
                        setDeclining(r._id);
                        setNote("");
                      }}
                    >
                      <LuX size={16} />
                      {t("requests.decline")}
                    </button>
                    <button
                      type="button"
                      className={styles.approve}
                      disabled={busy}
                      onClick={() => onReview(r, "approved")}
                    >
                      {busy ? <Spinner size="sm" /> : <LuCheck size={16} />}
                      {t("requests.approve")}
                    </button>
                  </div>
                )
              ) : (
                <span className={mergeClass(styles.badge, styles[`badge_${r.status}`])}>
                  {t(`requests.status.${r.status}`)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
