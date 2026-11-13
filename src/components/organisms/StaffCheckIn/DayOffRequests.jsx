"use client";
import RenderToast from "@/components/atoms/RenderToast";
import { formatRequestDay } from "@/components/templates/StaffRostering/RequestsPanel";
import { toDayKey } from "@/components/templates/StaffRostering/rosterUtils";
import useAxios from "@/interceptor/axios-functions";
import { mergeClass } from "@/resources/utils/helper";
import { useState } from "react";
import { Spinner } from "react-bootstrap";
import { LuCalendarPlus, LuX } from "react-icons/lu";
import styles from "./DayOffRequests.module.css";

/**
 * Staff side of R/O: ask for days off in the week being viewed, and follow
 * what the manager decided. A request is not approved leave until reviewed.
 */
export default function DayOffRequests({ weekDays, requests, holidayByDay = {}, onChanged, locale, t }) {
  const { Post, Delete } = useAxios();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState("");

  const todayKey = toDayKey(new Date());
  const activeByDay = Object.fromEntries(
    requests.filter((r) => r.status === "pending" || r.status === "approved").map((r) => [r.date, r]),
  );
  const upcoming = requests.filter((r) => r.date >= todayKey);

  function toggle(key) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function send() {
    if (!selected.length) {
      RenderToast({ type: "error", message: t("requests.pickDays") });
      return;
    }
    setLoading("send");
    const { response } = await Post({
      route: "staff-roster/requests",
      data: { dates: selected, reason },
    });
    if (response?.data) {
      RenderToast({ type: "success", message: t("requests.sent", { count: response.data.created }) });
      setOpen(false);
      setSelected([]);
      setReason("");
      await onChanged();
    }
    setLoading("");
  }

  async function withdraw(id) {
    setLoading(id);
    const { response } = await Delete({ route: `staff-roster/requests/${id}` });
    if (response) {
      RenderToast({ type: "success", message: t("requests.withdrawn") });
      await onChanged();
    }
    setLoading("");
  }

  return (
    <div className={styles.wrap}>
      {!open ? (
        <button type="button" className={styles.requestBtn} onClick={() => setOpen(true)}>
          <LuCalendarPlus size={18} />
          {t("requests.button")}
        </button>
      ) : (
        <div className={styles.form}>
          <div className={styles.formHeader}>
            <strong>{t("requests.formTitle")}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("requests.cancel")}>
              <LuX size={16} />
            </button>
          </div>
          <p className={styles.hint}>{t("requests.hint")}</p>

          <div className={styles.days}>
            {weekDays.map((d) => {
              const key = toDayKey(d);
              const past = key < todayKey;
              const taken = activeByDay[key];
              // no day off needed on a centre holiday
              const holiday = holidayByDay[key];
              const isOn = selected.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={past || !!taken || !!holiday}
                  aria-pressed={isOn}
                  title={
                    holiday
                      ? t("requests.holidayDay")
                      : taken
                        ? t("requests.alreadyRequested")
                        : undefined
                  }
                  className={mergeClass(
                    styles.day,
                    isOn ? styles.dayOn : "",
                    taken ? styles.dayTaken : "",
                    holiday ? styles.dayHoliday : "",
                  )}
                  onClick={() => toggle(key)}
                >
                  <span>{d.toLocaleDateString(locale, { weekday: "short" })}</span>
                  <strong>{d.getDate()}</strong>
                </button>
              );
            })}
          </div>

          <label className={styles.label} htmlFor="dayoff-reason">
            {t("requests.reason")}
          </label>
          <textarea
            id="dayoff-reason"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("requests.reasonPlaceholder")}
            className={styles.textarea}
          />

          <button
            type="button"
            className={styles.send}
            onClick={send}
            disabled={loading === "send" || !selected.length}
          >
            {loading === "send" ? (
              <Spinner size="sm" />
            ) : (
              t("requests.send", { count: selected.length })
            )}
          </button>
        </div>
      )}

      <div className={styles.listBlock}>
        <span className={styles.listTitle}>{t("requests.myRequests")}</span>
        {upcoming.length === 0 ? (
          <p className={styles.empty}>{t("requests.none")}</p>
        ) : (
          <ul className={styles.list}>
            {upcoming.map((r) => (
              <li key={r._id}>
                <div>
                  <strong>{formatRequestDay(r.date, locale)}</strong>
                  {r.reason && <span>{r.reason}</span>}
                  {r.status === "declined" && r.responseNote && (
                    <span className={styles.response}>{r.responseNote}</span>
                  )}
                </div>
                <span className={mergeClass(styles.badge, styles[`badge_${r.status}`])}>
                  {t(`requests.status.${r.status}`)}
                </span>
                {r.status === "pending" && (
                  <button
                    type="button"
                    className={styles.withdraw}
                    disabled={loading === r._id}
                    onClick={() => withdraw(r._id)}
                  >
                    {loading === r._id ? <Spinner size="sm" /> : t("requests.withdraw")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
