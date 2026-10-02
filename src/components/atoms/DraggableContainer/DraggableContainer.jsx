import React, { useEffect, useRef } from "react";
import classes from "./DraggableContainer.module.css";
import { mergeClass } from "@/resources/utils/helper";

export default function DraggableContainer({
  isHorizontal = true,
  showScrollbar = true,
  children,
  className,
  ...rest
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDragging = false;
    let startPos = 0;
    let startScroll = 0;
    let velocity = 0;
    let rafId;
    let hasMoved = false;

    const friction = 0.9; // lower = longer glide
    const dragThreshold = 5; // minimum px before drag starts

    const momentum = () => {
      if (isHorizontal) {
        el.scrollLeft += velocity;
      } else {
        el.scrollTop += velocity;
      }

      velocity *= friction;

      if (Math.abs(velocity) > 0.5) {
        rafId = requestAnimationFrame(momentum);
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      hasMoved = false;
      startPos = isHorizontal ? e.clientX : e.clientY;
      startScroll = isHorizontal ? el.scrollLeft : el.scrollTop;
      velocity = 0;
      cancelAnimationFrame(rafId);
      // Do NOT capture pointer yet to allow child clicks
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const delta = currentPos - startPos;

      // Start dragging only after threshold
      if (!hasMoved && Math.abs(delta) > dragThreshold) {
        hasMoved = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add("dragging");
      }

      if (!hasMoved) return;

      const prevScroll = isHorizontal ? el.scrollLeft : el.scrollTop;

      if (isHorizontal) {
        el.scrollLeft = startScroll - delta;
        velocity = el.scrollLeft - prevScroll;
      } else {
        el.scrollTop = startScroll - delta;
        velocity = el.scrollTop - prevScroll;
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;

      if (hasMoved) {
        el.releasePointerCapture(e.pointerId);
        el.classList.remove("dragging");
        e.preventDefault(); // prevents accidental click
        momentum();
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      cancelAnimationFrame(rafId);
    };
  }, [isHorizontal]);

  return (
    <div
      ref={containerRef}
      className={mergeClass(
        classes.draggableContainer,
        showScrollbar && classes.showScrollbar,
        className,
        isHorizontal ? classes.horizontal : classes.vertical,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
