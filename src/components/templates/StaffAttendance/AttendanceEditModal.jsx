"use client";
import Button from "@/components/atoms/Button";
import RenderToast from "@/components/atoms/RenderToast";
import ModalSkeleton from "@/components/organisms/Modals/ModalSkeleton/ModalSkeleton";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useState } from "react";
import { LuHistory, LuPlus } from "react-icons/lu";
import TimePicker from "../StaffRostering/TimePicker";
import { formatTime } from "./attendanceUtils";
import styles from "./AttendanceEditModal.module.css";

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (d) => (d ? `${pad(new Date(d).getHours())}:${pad(new Date(d).getMinutes())}` : "");

/** Session → editable times ('HH:mm'). */
function toForm(session, scheduled) {
  if (!session)
    return {
      checkIn: scheduled?.startTime || "08:00",
      lunch: false,
      lunchStart: "12:30",
      lunchEnd: "13:00",
      checkOut: scheduled?.endTime || "16:00",
    };
  const lunch = session.breaks?.[0];
  return {
    checkIn: hhmm(session.checkIn),
    lunch: !!lunch,
    lunchStart: lunch ? hhmm(lunch.start) : "12:30",
    lunchEnd: lunch?.end ? hhmm(lunch.end) : "13:00",
    // A forgotten clock-out starts from the planned end of the shift
    checkOut:
      hhmm(session.checkOut) ||
      (session.missedCheckOut ? scheduled?.endTime || "16:00" : ""),
  };
}

/** 'HH:mm' on the record's day; a time earlier than clock-in is the next day. */
function toDate(day, time, after) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  if (after && d < after) d.setDate(d.getDate() + 1);
  return d;
}

const snapText = (snap, locale, t) => {
  if (!snap) return t("edit.noRecord");
  const lunch = (snap.breaks || [])
    .map((b) => `${formatTime(b.start, locale)}–${b.end ? formatTime(b.end, locale) : "?"}`)
    .join(", ");
  return `${formatTime(snap.checkIn, locale)} – ${snap.checkOut ? formatTime(snap.checkOut, locale) : "?"}${
    lunch ? ` · ${t("edit.lunch")} ${lunch}` : ""
  }`;
};

/**
 * Manager: correct a staff member's attendance on one day, or add a missing
 * record. Every change needs a reason and is kept in the record's audit trail.
 */
export default function AttendanceEditModal({ show, setShow, staffName, staffId, date, sessions, scheduled, onSaved }) {
  const t = useTranslations("staffAttendancePage");
  const locale = useLocale();
  const { Patch, Post } = useAxios();
  const [selected, setSelected] = useState(sessions.length ? 0 : -1); // -1 = new record
  const session = selected >= 0 ? sessions[selected] : null;
  const [form, setForm] = useState(() => toForm(session, scheduled));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // A record still running (not clocked out, not stale) may stay open
  const isLive = !!session && !session.checkOut && !session.missedCheckOut;

  function pick(index) {
    setSelected(index);
    setForm(toForm(index >= 0 ? sessions[index] : null, scheduled));
    setError("");
  }

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    const day = session ? new Date(session.checkIn) : date;
    const checkIn = toDate(day, form.checkIn);
    const checkOut = toDate(day, form.checkOut, checkIn);
    const lunchStart = form.lunch ? toDate(day, form.lunchStart, checkIn) : null;
    const lunchEnd = form.lunch ? toDate(day, form.lunchEnd, lunchStart || checkIn) : null;

    if (!reason.trim() || reason.trim().length < 3) return setError(t("edit.errors.reason"));
    if (!checkOut && !isLive) return setError(t("edit.errors.clockOut"));
    if (checkOut && checkOut <= checkIn) return setError(t("edit.errors.order"));
    if (form.lunch && !lunchEnd && checkOut) return setError(t("edit.errors.lunchReturn"));
    if (form.lunch && (lunchStart < checkIn || (checkOut && (lunchEnd || lunchStart) > checkOut)))
      return setError(t("edit.errors.lunchInside"));
    if ([checkIn, checkOut, lunchStart, lunchEnd].some((d) => d && d > new Date()))
      return setError(t("edit.errors.future"));

    const payload = {
      checkIn: checkIn.toISOString(),
      checkOut: checkOut ? checkOut.toISOString() : null,
      breaks: form.lunch
        ? [{ start: lunchStart.toISOString(), end: lunchEnd ? lunchEnd.toISOString() : null }]
        : [],
      reason: reason.trim(),
    };
    setError("");
    setSaving(true);
    const { response } = session
      ? await Patch({ route: `staff-attendance/${session._id}/correct`, data: payload })
      : await Post({ route: "staff-attendance/manual", data: { ...payload, staff: staffId } });
    setSaving(false);
    if (response) {
      RenderToast({ type: "success", message: session ? t("edit.toastCorrected") : t("edit.toastAdded") });
      onSaved();
      setShow(false);
    }
  }

  const history = sessions.flatMap((s) => (s.corrections || []).map((c) => ({ ...c, session: s })));

  return (
    <ModalSkeleton show={show} setShow={setShow} header={t("edit.title")} maxWidth="600px" padding="24px">
      <div className={styles.body}>
        <div className={styles.who}>
          <strong>{staffName}</strong>
          <span>
            {date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {scheduled?.startTime && ` · ${t("edit.planned")} ${scheduled.startTime}–${scheduled.endTime}`}
          </span>
        </div>

        <div className={styles.chips}>
          {sessions.map((s, i) => (
            <button
              key={s._id}
              type="button"
              className={mergeClass(styles.chip, selected === i ? styles.chipOn : "")}
              onClick={() => pick(i)}
            >
              {formatTime(s.checkIn, locale)} – {s.checkOut ? formatTime(s.checkOut, locale) : "?"}
            </button>
          ))}
          <button
            type="button"
            className={mergeClass(styles.chip, styles.chipAdd, selected === -1 ? styles.chipOn : "")}
            onClick={() => pick(-1)}
          >
            <LuPlus size={14} /> {t("edit.addRecord")}
          </button>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="att-in">{t("edit.clockIn")}</label>
            <TimePicker id="att-in" value={form.checkIn} onChange={set("checkIn")} hourLabel={t("edit.hour")} minuteLabel={t("edit.minute")} />
          </div>
          <div className={styles.field}>
            <label htmlFor="att-out">
              {t("edit.clockOut")}
              {isLive && <span className={styles.optional}> {t("edit.optionalLive")}</span>}
            </label>
            {form.checkOut || !isLive ? (
              <TimePicker id="att-out" value={form.checkOut || "16:00"} onChange={set("checkOut")} hourLabel={t("edit.hour")} minuteLabel={t("edit.minute")} />
            ) : (
              <button type="button" className={styles.setBtn} onClick={() => set("checkOut")("16:00")}>
                {t("edit.setClockOut")}
              </button>
            )}
          </div>
        </div>

        <label className={styles.check}>
          <input type="checkbox" checked={form.lunch} onChange={(e) => set("lunch")(e.target.checked)} />
          {t("edit.lunchTaken")}
        </label>
        {form.lunch && (
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="att-ls">{t("edit.lunchOut")}</label>
              <TimePicker id="att-ls" value={form.lunchStart} onChange={set("lunchStart")} hourLabel={t("edit.hour")} minuteLabel={t("edit.minute")} />
            </div>
            <div className={styles.field}>
              <label htmlFor="att-le">{t("edit.lunchReturn")}</label>
              <TimePicker id="att-le" value={form.lunchEnd} onChange={set("lunchEnd")} hourLabel={t("edit.hour")} minuteLabel={t("edit.minute")} />
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="att-reason">
            {t("edit.reason")} <span className={styles.required}>*</span>
          </label>
          <textarea
            id="att-reason"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("edit.reasonPlaceholder")}
            className={styles.textarea}
          />
          <span className={styles.hint}>{t("edit.auditHint")}</span>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {history.length > 0 && (
          <div className={styles.history}>
            <span className={styles.historyTitle}>
              <LuHistory size={15} /> {t("edit.history")}
            </span>
            <ul>
              {history.map((c, i) => (
                <li key={i}>
                  <div className={styles.historyHead}>
                    <strong>{c.correctedBy?.fullName?.[locale] || c.correctedBy?.fullName?.en || "-"}</strong>
                    <span>
                      {new Date(c.correctedAt).toLocaleString(locale, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className={styles.historyChange}>
                    <span className={styles.before}>{snapText(c.before, locale, t)}</span>
                    <span aria-hidden>→</span>
                    <span className={styles.after}>{snapText(c.after, locale, t)}</span>
                  </div>
                  <em>“{c.reason}”</em>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.footer}>
          <Button label={t("edit.cancel")} variant="outlined" onClick={() => setShow(false)} disabled={saving} />
          <Button
            label={saving ? t("edit.saving") : session ? t("edit.saveCorrection") : t("edit.addRecord")}
            variant="primary"
            onClick={save}
            disabled={saving}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
