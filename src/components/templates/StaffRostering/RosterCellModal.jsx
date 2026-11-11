"use client";
import Button from "@/components/atoms/Button";
import ModalSkeleton from "@/components/organisms/Modals/ModalSkeleton/ModalSkeleton";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useState } from "react";
import { LuInfo, LuLock, LuMoon, LuTrash2 } from "react-icons/lu";
import {
  BREAK_OPTIONS,
  DEFAULT_SHIFT,
  ENTRY_CODES,
  ENTRY_TYPES,
  entryKey,
  formatHours,
  isOvernight,
  shiftLength,
  toDayKey,
} from "./rosterUtils";
import styles from "./RosterCellModal.module.css";
import TimePicker from "./TimePicker";

const NOTE_MAX = 200;

/**
 * Edit one staff member's day: a shift (start, end, unpaid break) or a code
 * (Day off, R/O, HOL, B/HOL). The same value can be applied to other days of the week.
 */
export default function RosterCellModal({
  show,
  setShow,
  staff,
  staffName,
  day,
  weekDays,
  entries,
  request,
  holiday,
  isSelf = false, // the manager's own row: they can't decide their own R/O
  onReview,
  onApply,
}) {
  const t = useTranslations("staffRosterPage");
  const locale = useLocale();
  const staffId = String(staff._id);
  const dayKey = toDayKey(day);
  const existing = entries[entryKey(staffId, dayKey)] || null;
  // Your own R/O that another manager approved / declined can't be changed by you
  const isLockedFor = (entry) =>
    isSelf && entry?.type === "ro" && !!entry.roDecision && entry.roDecision !== "pending";
  const locked = isLockedFor(existing);

  // A new shift starts from the staff member's usual hours when they have them
  const defaults = {
    startTime: staff?.shiftStart || DEFAULT_SHIFT.startTime,
    endTime: staff?.shiftEnd || DEFAULT_SHIFT.endTime,
    breakMinutes: DEFAULT_SHIFT.breakMinutes,
  };

  // On a centre holiday a new entry starts as HOL / B/HOL
  const [type, setType] = useState(
    existing?.type || (holiday ? (holiday.type === "bank-holiday" ? "bhol" : "hol") : "shift"),
  );
  const [startTime, setStartTime] = useState(
    existing?.startTime || defaults.startTime,
  );
  const [endTime, setEndTime] = useState(existing?.endTime || defaults.endTime);
  const [breakMinutes, setBreakMinutes] = useState(
    existing?.startTime
      ? Number(existing.breakMinutes) || 0
      : defaults.breakMinutes,
  );
  const [roDecision, setRoDecision] = useState(
    existing?.roDecision || "pending",
  );
  const [note, setNote] = useState(existing?.note || "");
  const [applyTo, setApplyTo] = useState([dayKey]);
  const [submitted, setSubmitted] = useState(false);

  const needsTimes =
    type === "shift" || (type === "ro" && roDecision === "declined");
  const length = shiftLength(startTime, endTime);
  const paid = Math.max(0, length - breakMinutes);

  let error = "";
  if (needsTimes) {
    if (!startTime || !endTime) error = t("editor.errors.times");
    else if (startTime === endTime) error = t("editor.errors.sameTime");
    else if (breakMinutes >= length) error = t("editor.errors.break");
  }
  if (!applyTo.length) error = error || t("editor.errors.days");

  const isLockedDay = (key) => isLockedFor(entries[entryKey(staffId, key)]);
  const pickDays = (keys) => setApplyTo(keys.filter((k) => !isLockedDay(k)));

  function toggleDay(key) {
    if (isLockedDay(key)) return;
    setApplyTo((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleApply() {
    setSubmitted(true);
    if (error) return;
    onApply(applyTo, {
      type,
      startTime: needsTimes ? startTime : null,
      endTime: needsTimes ? endTime : null,
      breakMinutes: needsTimes ? Number(breakMinutes) || 0 : 0,
      roDecision: type === "ro" ? roDecision : null,
      note: note.trim(),
    });
  }

  const typeLabel = (value) =>
    value === "shift"
      ? t("editor.types.shift")
      : `${ENTRY_CODES[value]} · ${t(`legend.${value}`)}`;

  if (locked)
    return (
      <ModalSkeleton
        show={show}
        setShow={setShow}
        header={t("editor.title")}
        maxWidth="560px"
        padding="24px"
      >
        <div className={styles.body}>
          <div className={styles.who}>
            <strong>{staffName}</strong>
            <span>
              {day.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className={styles.lockedBox}>
            <LuLock size={20} />
            <div>
              <strong>
                {ENTRY_CODES.ro} ·{" "}
                {existing.roDecision === "approved"
                  ? t("requests.status.approved")
                  : t("requests.status.declined")}
                {existing.startTime ? ` · ${existing.startTime}–${existing.endTime}` : ""}
              </strong>
              <span>{t("editor.lockedOwn")}</span>
              {existing.note && <em>“{existing.note}”</em>}
            </div>
          </div>
          <div className={styles.footer}>
            <span />
            <Button label={t("editor.close")} variant="primary" onClick={() => setShow(false)} />
          </div>
        </div>
      </ModalSkeleton>
    );

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      header={t("editor.title")}
      maxWidth="560px"
      padding="24px"
    >
      <div className={styles.body}>
        <div className={styles.who}>
          <strong>{staffName}</strong>
          <span>
            {day.toLocaleDateString(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {holiday && (
          <p className={styles.holidayInfo}>
            <b>{holiday.type === "bank-holiday" ? "B/HOL" : "HOL"}</b>
            {holiday.name?.[locale] || holiday.name?.en}
          </p>
        )}

        {request && (
          <div className={styles.request}>
            <p>
              <strong>{t("requests.editorTitle", { name: staffName })}</strong>
              <span>{request.reason ? `“${request.reason}”` : t("requests.noReason")}</span>
            </p>
            {isSelf ? (
              <span className={styles.selfNote}>{t("requests.ownRequest")}</span>
            ) : (
              <div className={styles.requestActions}>
                <button
                  type="button"
                  className={styles.requestDecline}
                  onClick={() => onReview(request, "declined")}
                >
                  {t("requests.decline")}
                </button>
                <button
                  type="button"
                  className={styles.requestApprove}
                  onClick={() => onReview(request, "approved")}
                >
                  {t("requests.approve")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label>{t("editor.type")}</label>
          <div className={styles.types} role="radiogroup">
            {ENTRY_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                className={mergeClass(
                  styles.typeBtn,
                  styles[`type_${value}`],
                  type === value ? styles.typeActive : "",
                )}
                onClick={() => setType(value)}
              >
                {typeLabel(value)}
              </button>
            ))}
          </div>
        </div>

        {type === "ro" && (
          <>
            <p className={styles.info}>
              <LuInfo size={16} />
              {t("editor.roInfo")}
            </p>
            <div className={styles.field}>
              <label>{t("editor.roDecision")}</label>
              <div className={styles.decisions} role="radiogroup">
                {["pending", "approved", "declined"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    // Own R/O: only the decision another manager already made can stay
                    disabled={
                      isSelf &&
                      value !== "pending" &&
                      value !== (existing?.type === "ro" ? existing.roDecision : null)
                    }
                    aria-checked={roDecision === value}
                    className={mergeClass(
                      styles.decisionBtn,
                      styles[`decision_${value}`],
                      roDecision === value ? styles.decisionActive : "",
                    )}
                    onClick={() => setRoDecision(value)}
                  >
                    <strong>{t(`editor.decisions.${value}`)}</strong>
                    <span>{t(`editor.decisions.${value}Hint`)}</span>
                  </button>
                ))}
              </div>
              {isSelf && <span className={styles.selfNote}>{t("requests.ownRo")}</span>}
            </div>
          </>
        )}

        {needsTimes && (
          <div className={styles.shiftGrid}>
            <div className={styles.field}>
              <label htmlFor="roster-start">{t("editor.start")}</label>
              <TimePicker
                id="roster-start"
                value={startTime}
                onChange={setStartTime}
                hourLabel={t("editor.hour")}
                minuteLabel={t("editor.minute")}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="roster-end">{t("editor.end")}</label>
              <TimePicker
                id="roster-end"
                value={endTime}
                onChange={setEndTime}
                hourLabel={t("editor.hour")}
                minuteLabel={t("editor.minute")}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="roster-break">{t("editor.break")}</label>
              <select
                id="roster-break"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className={styles.input}
              >
                {BREAK_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m
                      ? t("editor.breakMinutes", { minutes: m })
                      : t("editor.noBreak")}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.hours}>
              <span>{t("editor.scheduled")}</span>
              <strong>{length ? formatHours(paid) : "-"}</strong>
              {isOvernight(startTime, endTime) && (
                <em>
                  <LuMoon size={12} /> {t("editor.overnight")}
                </em>
              )}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="roster-note">
            {t("editor.note")}{" "}
            <span className={styles.optional}>{t("editor.optional")}</span>
          </label>
          <textarea
            id="roster-note"
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("editor.notePlaceholder")}
            className={mergeClass(styles.input, styles.textarea)}
            rows={2}
          />
        </div>

        <div className={styles.field}>
          <label>{t("editor.applyTo")}</label>
          <div className={styles.days}>
            {weekDays.map((d) => {
              const key = toDayKey(d);
              const selected = applyTo.includes(key);
              const dayLocked = isLockedDay(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  disabled={dayLocked}
                  title={dayLocked ? t("editor.lockedOwn") : undefined}
                  className={mergeClass(
                    styles.dayChip,
                    selected ? styles.dayChipActive : "",
                  )}
                  onClick={() => toggleDay(key)}
                >
                  <span>
                    {d.toLocaleDateString(locale, { weekday: "short" })}
                  </span>
                  <strong>{d.getDate()}</strong>
                  {entries[entryKey(staffId, key)] && key !== dayKey && <i />}
                </button>
              );
            })}
          </div>
          <div className={styles.quickPicks}>
            <button
              type="button"
              onClick={() => pickDays(weekDays.slice(0, 5).map(toDayKey))}
            >
              {t("editor.weekdays")}
            </button>
            <button
              type="button"
              onClick={() => pickDays(weekDays.map(toDayKey))}
            >
              {t("editor.wholeWeek")}
            </button>
            <button type="button" onClick={() => setApplyTo([dayKey])}>
              {t("editor.onlyThisDay")}
            </button>
          </div>
          {applyTo.some(
            (k) => k !== dayKey && entries[entryKey(staffId, k)],
          ) && <p className={styles.overwrite}>{t("editor.overwriteHint")}</p>}
        </div>

        {submitted && error && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          {existing ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => onApply([dayKey], null)}
            >
              <LuTrash2 size={16} />
              {t("editor.clear")}
            </button>
          ) : (
            <span />
          )}
          <div className={styles.footerActions}>
            <Button
              label={t("editor.cancel")}
              variant="outlined"
              onClick={() => setShow(false)}
            />
            <Button
              label={t("editor.apply")}
              variant="primary"
              onClick={handleApply}
            />
          </div>
        </div>
      </div>
    </ModalSkeleton>
  );
}

