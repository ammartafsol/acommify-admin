"use client";
import ModalSkeleton from "@/components/organisms/Modals/ModalSkeleton/ModalSkeleton";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { formatRequestDay } from "./RequestsPanel";
import { ENTRY_CODES, isWorking } from "./rosterUtils";
import styles from "./RosterHistoryModal.module.css";

/** "08:00–16:00", "R/O", "HOL" … or "–" for no entry. */
export function describeEntry(e) {
  if (!e) return "–";
  if (isWorking(e)) return `${e.startTime}–${e.endTime}`;
  return ENTRY_CODES[e.type] || e.type;
}

const sameEntry = (a, b) => describeEntry(a) === describeEntry(b) && (a?.note || "") === (b?.note || "");

/** Day-by-day changes between two versions, grouped by staff member. */
function diff(prevEntries = [], nextEntries = []) {
  const key = (e) => `${e.staff}_${e.date}`;
  const prev = Object.fromEntries(prevEntries.map((e) => [key(e), e]));
  const next = Object.fromEntries(nextEntries.map((e) => [key(e), e]));
  const keys = [...new Set([...Object.keys(prev), ...Object.keys(next)])].sort();
  const byStaff = {};
  keys.forEach((k) => {
    if (sameEntry(prev[k], next[k])) return;
    const [staff, date] = k.split("_");
    (byStaff[staff] ||= []).push({ date, before: prev[k], after: next[k] });
  });
  return byStaff;
}

/** Every issued version of the week: who issued it, when, and what changed. */
export default function RosterHistoryModal({ show, setShow, weekStart, staffName }) {
  const t = useTranslations("staffRosterPage");
  const locale = useLocale();
  const { Get } = useAxios();
  const [versions, setVersions] = useState(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    Get({ route: `staff-roster/history?weekStart=${weekStart}` }).then(({ response }) =>
      setVersions(Array.isArray(response?.data) ? response.data : []),
    );
  }, [weekStart]);

  return (
    <ModalSkeleton show={show} setShow={setShow} header={t("history.title")} maxWidth="640px" padding="24px">
      <div className={styles.body}>
        {!versions ? (
          <div className={styles.loading}>
            <Spinner size="sm" />
          </div>
        ) : !versions.length ? (
          <p className={styles.empty}>{t("history.empty")}</p>
        ) : (
          <ol className={styles.list}>
            {versions.map((v, i) => {
              const previous = versions[i + 1];
              const changes = diff(previous?.entries || [], v.entries || []);
              const changedNames = (v.changedStaff || []).map((id) => staffName(id)).filter(Boolean);
              const isOpen = open === i;
              return (
                <li key={v.version} className={mergeClass(styles.item, i === 0 ? styles.current : "")}>
                  <button type="button" className={styles.head} onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                    <span className={styles.version}>v{v.version}</span>
                    <span className={styles.meta}>
                      <strong>
                        {i === 0 ? t("history.current") : t("history.version", { version: v.version })}
                        {" · "}
                        {new Date(v.issuedAt).toLocaleString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                      <span>
                        {t("history.issuedBy", {
                          name: v.issuedBy?.fullName?.[locale] || v.issuedBy?.fullName?.en || "-",
                        })}
                        {" · "}
                        {previous
                          ? changedNames.length
                            ? t("history.changedFor", { names: changedNames.join(", ") })
                            : t("history.noChanges")
                          : t("history.firstIssue")}
                      </span>
                    </span>
                    {isOpen ? <LuChevronDown size={18} /> : <LuChevronRight size={18} className={styles.flipRtl} />}
                  </button>

                  {isOpen && (
                    <div className={styles.changes}>
                      {!previous ? (
                        <p className={styles.note}>{t("history.firstIssueText", { count: v.entries?.length || 0 })}</p>
                      ) : !Object.keys(changes).length ? (
                        <p className={styles.note}>{t("history.noChanges")}</p>
                      ) : (
                        Object.entries(changes).map(([staff, list]) => (
                          <div key={staff} className={styles.staff}>
                            <strong>{staffName(staff) || "-"}</strong>
                            <ul>
                              {list.map((c) => (
                                <li key={c.date}>
                                  <span className={styles.day}>{formatRequestDay(c.date, locale)}</span>
                                  <span className={styles.before}>{describeEntry(c.before)}</span>
                                  <span aria-hidden>→</span>
                                  <span className={styles.after}>{describeEntry(c.after)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </ModalSkeleton>
  );
}
