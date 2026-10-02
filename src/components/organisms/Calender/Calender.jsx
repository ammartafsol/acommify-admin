"use client";
import Button from "@/components/atoms/Button";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import "./styles.css";
import styles from "./styles.module.css";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";

const localizer = momentLocalizer(moment);

export default function CalendarComponent({
  events = [],
  onDaySelect = () => {},
  onRangeChange = () => {},
  onEventClick = () => {},
  userSelectedDate = null,
}) {
  const t = useTranslations("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const date = currentDate;
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Start: 7 days before first day of current month
    const start = new Date(firstDayOfMonth);
    start.setDate(firstDayOfMonth.getDate() - 7);

    // End: 7 days after last day of current month
    const end = new Date(lastDayOfMonth);
    end.setDate(lastDayOfMonth.getDate() + 7);

    onRangeChange({ start, end });
  }, []); // Only on mount

  const handleSelectSlot = ({ start }) => {
    const selectedDate = new Date(start);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    if (onDaySelect) {
      onDaySelect({ date: selectedDate });
    }
  };

  const CustomHeader = ({ date, label }) => {
    return (
      <div className={styles.monthHeader}>
        <span>{moment(date).format("ddd")}</span>
      </div>
    );
  };

  const dayPropGetter = useCallback(
    (date) => {
      const isSelected = moment(date).isSame(moment(userSelectedDate), "day");

      return {
        className: mergeClass(
          date < today ? styles.disabledDate : "",
          isSelected ? styles.selectedDate : ""
        ),
      };
    },
    [userSelectedDate]
  );

  const CustomToolbar = ({ label, onNavigate, date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only allow navigation to previous month if it's not before current month
    const isPrevDisabled =
      moment(date).year() < moment(today).year() ||
      (moment(date).year() === moment(today).year() &&
        moment(date).month() <= moment(today).month());

    return (
      <div className={styles.customToolbar}>
        <div className={styles.navigationButtons}>
          <Button
            onClick={() => onNavigate("PREV")}
            className={styles.navButton}
            leftIcon={<BiChevronLeft size={18} />}
            disabled={isPrevDisabled}
          />
          <Button
            onClick={() => onNavigate("NEXT")}
            className={styles.navButton}
            leftIcon={<BiChevronRight size={18} />}
          />
          <Button
            variant="primary"
            onClick={() => onNavigate("TODAY")}
            className={styles.todayButton}
            label={t("today")}
          />
        </div>
        <h2 className={styles.monthYear}>{label}</h2>
        <div style={{ width: 75 }} />
      </div>
    );
  };

  const CustomEvent = ({ event }) => {
    const isCancelled = event?.status === "cancelled";
    const isPending = event?.status === "pending";
    const isRejected = event?.status === "rejected";
    const isConfirmed = event?.status === "completed";
    return (
      <div
        // onClick={(e) => {
        //   if (isCancelled || isRejected) {
        //     e.preventDefault();
        //     e.stopPropagation();
        //   }
        // }}
        className={mergeClass(
          styles.event,
          isCancelled || isRejected ? styles.cancelledEvent : "",
          isPending ? styles.pendingEvent : "",
          isConfirmed ? styles.confirmedEvent : ""
        )}
      >
        <span>{event.title || t("myBooking")} </span>
      </div>
    );
  };

  return (
    <div className={styles.main}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        view="month"
        onSelectEvent={onEventClick}
        onNavigate={setCurrentDate}
        onRangeChange={onRangeChange}
        dayPropGetter={dayPropGetter}
        views={{
          month: true,
          week: false,
          day: false,
          agenda: false,
          work_week: false,
        }}
        selectable={true}
        onSelectSlot={handleSelectSlot}
        popup
        components={{
          toolbar: CustomToolbar,
          month: {
            header: CustomHeader,
          },
          event: CustomEvent,
        }}
        className={styles.calendar}
        onDrillDown={(date, view) => handleSelectSlot({ start: date })}
      />
    </div>
  );
}

// [
//   {
//     id: 1,
//     title: "Availability: 7",
//     start: new Date(2025, 7, 5),
//     end: new Date(2025, 7, 5),
//     resource: { type: "availability", count: 7 },
//   },
//   {
//     id: 2,
//     title: "Availability: 12",
//     start: new Date(2025, 7, 8),
//     end: new Date(2025, 7, 8),
//     resource: { type: "availability", count: 12 },
//   },
//   {
//     id: 3,
//     title: "Availability: 5",
//     start: new Date(2025, 7, 15),
//     end: new Date(2025, 7, 15),
//     resource: { type: "availability", count: 5 },
//   },
// ];
