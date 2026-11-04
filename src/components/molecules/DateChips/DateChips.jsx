"use client";
import { mergeClass } from "@/resources/utils/helper";
import moment from "moment-timezone";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classes from "./DateChips.module.css";

const POPOVER_GAP = 6;

// Green when plenty left, orange when a quarter or less, red when full
const seatTone = (available, total) => {
  if (available <= 0) return classes.full;
  if (total && available / total <= 0.25) return classes.low;
  return classes.ok;
};

/**
 * Shows the first `max` dates as chips plus a "+N" chip. Hovering the dates
 * (or tapping "+N") lists every date, with seats left per date when given.
 * Past dates are muted.
 * @param {{
 *   dates: (string|Date|{date: string|Date, available?: number})[],
 *   total?: number, max?: number, format?: string,
 *   title?: string, seatsLabel?: string
 * }} props
 */
export default function DateChips({
  dates = [],
  total,
  max = 2,
  format = "DD-MM-YY",
  title,
  seatsLabel,
}) {
  const wrapRef = useRef(null);
  const [anchor, setAnchor] = useState(null);

  const today = moment().startOf("day");
  const items = (Array.isArray(dates) ? dates : [])
    .map((entry) => {
      const isObj = entry && typeof entry === "object" && !(entry instanceof Date);
      const m = moment(isObj ? entry.date : entry);
      return {
        m,
        label: m.format(format),
        past: m.isBefore(today),
        available: isObj && Number.isFinite(entry.available) ? entry.available : null,
      };
    })
    .filter((d) => d.m.isValid())
    .sort((a, b) => a.m - b.m);

  // Close when the page scrolls or resizes (the position would be stale)
  useEffect(() => {
    if (!anchor) return undefined;
    const close = () => setAnchor(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [anchor]);

  if (!items.length) return <span className={classes.empty}>N/A</span>;

  // Upcoming dates are the useful ones, so they get the visible chips first
  const visible = [...items.filter((d) => !d.past), ...items.filter((d) => d.past)].slice(0, max);
  const hidden = items.length - visible.length;
  const hasSeats = items.some((d) => d.available !== null);
  const canOpen = hidden > 0 || hasSeats;
  const open = () => canOpen && setAnchor(wrapRef.current?.getBoundingClientRect() || null);

  return (
    <div
      ref={wrapRef}
      className={mergeClass(classes.chips, canOpen ? classes.hoverable : "")}
      onMouseEnter={open}
      onMouseLeave={() => setAnchor(null)}
    >
      {visible.map((d) => (
        <span key={d.label} className={mergeClass(classes.chip, d.past ? classes.past : "")}>
          {d.label}
        </span>
      ))}
      {canOpen && (
        <button
          type="button"
          className={classes.more}
          onFocus={open}
          onBlur={() => setAnchor(null)}
          onClick={(e) => {
            // don't trigger the table row's click
            e.stopPropagation();
            anchor ? setAnchor(null) : open();
          }}
          aria-label={hidden > 0 ? `+${hidden}` : seatsLabel || title}
        >
          {hidden > 0 ? `+${hidden}` : "i"}
        </button>
      )}
      {anchor && (
        <DatesPopover
          anchor={anchor}
          items={items}
          total={total}
          title={title}
          seatsLabel={seatsLabel}
          hasSeats={hasSeats}
        />
      )}
    </div>
  );
}

function DatesPopover({ anchor, items, total, title, seatsLabel, hasSeats }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  // Above the dates when there is room, otherwise below; kept on screen
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    const left = Math.min(
      Math.max(8, anchor.left + anchor.width / 2 - w / 2),
      window.innerWidth - w - 8,
    );
    const above = anchor.top - POPOVER_GAP - h;
    const top = above > 8 ? above : anchor.bottom + POPOVER_GAP;
    setPos({ top, left });
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className={mergeClass(classes.popover, hasSeats ? classes.popoverList : "")}
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {hasSeats ? (
        <>
          <div className={classes.listHeader}>
            <span>{title}</span>
            <span>{seatsLabel}</span>
          </div>
          <ul className={classes.list}>
            {items.map((d) => (
              <li key={d.label} className={d.past ? classes.rowPast : ""}>
                <span className={mergeClass(classes.chip, d.past ? classes.past : "")}>
                  {d.label}
                </span>
                {d.available !== null && (
                  <span className={mergeClass(classes.seats, d.past ? "" : seatTone(d.available, total))}>
                    {d.available}
                    {total ? ` / ${total}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {title && <p className={classes.popoverTitle}>{title}</p>}
          <div className={classes.popoverChips}>
            {items.map((d) => (
              <span key={d.label} className={mergeClass(classes.chip, d.past ? classes.past : "")}>
                {d.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
