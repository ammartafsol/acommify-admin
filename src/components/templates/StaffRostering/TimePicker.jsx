"use client";
import { mergeClass } from "@/resources/utils/helper";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown, LuClock } from "react-icons/lu";
import styles from "./TimePicker.module.css";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const PANEL_WIDTH = 220;
const PANEL_HEIGHT = 280;
const GAP = 6;

/**
 * 24-hour time field with its own dropdown (hour + minute columns).
 * Used instead of <input type="time">, whose browser popup doesn't close inside the modal.
 */
export default function TimePicker({ id, value, onChange, hourLabel, minuteLabel }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const [hour = "08", minute = "00"] = (value || "").split(":");
  // Keep an existing value that isn't on the 5-minute grid (e.g. 08:07)
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  function place() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(8, rect.left), vw - PANEL_WIDTH - 8);
    const below = rect.bottom + GAP;
    const top =
      below + PANEL_HEIGHT > vh - 8 && rect.top - GAP - PANEL_HEIGHT > 8
        ? rect.top - GAP - PANEL_HEIGHT
        : below;
    setPos({ top, left, width: Math.max(PANEL_WIDTH, rect.width) });
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  // Scroll the selected hour / minute into view when the panel opens
  useEffect(() => {
    if (!open || !pos) return;
    panelRef.current
      ?.querySelectorAll(`.${styles.selected}`)
      .forEach((el) => el.scrollIntoView({ block: "center" }));
  }, [open, !!pos]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // keep the modal open
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const column = (items, selected, label, pick) => (
    <div className={styles.column} role="listbox" aria-label={label}>
      <span className={styles.columnLabel}>{label}</span>
      <div className={styles.options}>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={item === selected}
            className={mergeClass(styles.option, item === selected ? styles.selected : "")}
            onClick={() => pick(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={mergeClass(styles.trigger, open ? styles.triggerOpen : "")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <LuClock size={17} className={styles.icon} />
        <span className={styles.value}>
          {hour}:{minute}
        </span>
        <LuChevronDown size={16} className={styles.chevron} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: pos?.width ?? PANEL_WIDTH,
              visibility: pos ? "visible" : "hidden",
            }}
          >
            <div className={styles.preview}>
              {hour}
              <span>:</span>
              {minute}
            </div>
            <div className={styles.columns}>
              {column(HOURS, hour, hourLabel, (h) => onChange(`${h}:${minute}`))}
              <i className={styles.divider} />
              {column(minutes, minute, minuteLabel, (m) => {
                onChange(`${hour}:${m}`);
                // Picking the minute finishes the selection
                setOpen(false);
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
