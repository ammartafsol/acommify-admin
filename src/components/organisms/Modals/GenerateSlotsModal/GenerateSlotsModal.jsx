"use client";
import Button from "@/components/atoms/Button";
import Checkbox from "@/components/atoms/Checkbox/Checkbox";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import useAxios from "@/interceptor/axios-functions";
import { useFormik } from "formik";
import moment from "moment-timezone";
import { useState } from "react";
import { FaClock } from "react-icons/fa6";
import * as Yup from "yup";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import styles from "./GenerateSlotsModal.module.css";

// Fixed interval to 1 hour (60 minutes)
const FIXED_INTERVAL = 60;

// Helper function to format hour to AM/PM
const formatHourToAMPM = (hour) => {
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
};

// Hour options for dropdown (AM/PM format)
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, "0")}:00`,
  label: formatHourToAMPM(i),
}));

// End hour options including next day 12 AM for late night slots
const endHourOptions = [
  ...hourOptions,
  {
    value: "24:00", // Represents 12 AM next day
    label: "12:00 AM (Next Day)",
  },
];

export default function GenerateSlotsModal({
  show,
  setShow,
  data,
  previousEvent = null,
  t,
  cb = () => {},
}) {
  const [step, setStep] = useState(previousEvent ? 0 : 1);
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const { Post } = useAxios();

  const formik = useFormik({
    initialValues: {
      startTime: null,
      endTime: null,
    },
    validationSchema: Yup.object({
      startTime: Yup.object()
        .nullable()
        .required(t("generateSlotModal.validation.startTimeRequired")),
      endTime: Yup.object()
        .nullable()
        .required(t("generateSlotModal.validation.endTimeRequired"))
        .test(
          "is-greater",
          "End time must be greater than start time",
          function (value) {
            const { startTime } = this.parent;
            if (!startTime || !value) return true;
            const startMins = timeToMinutes(startTime.value);
            const endMins = timeToMinutes(value.value);
            // Allow end time to be next day (24:00) or same day but greater
            return (
              endMins > startMins ||
              (endMins === 24 * 60 && startMins < 24 * 60)
            );
          }
        ),
    }),
    onSubmit: () => {
      setSelectedSlots([]);
      generateSlots();
      setStep(2);
    },
  });

  console.log(formik.errors);
  console.log(formik.touched);

  const timeToMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    // Handle 24:00 as 1440 minutes (next day midnight)
    if (h === 24) return 24 * 60;
    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    // Handle overflow to next day
    if (mins >= 24 * 60) {
      return "00:00"; // Reset to midnight for display
    }
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Helper to format "HH:MM" to 12-hour format with AM/PM
  const formatAMPM = (time) => {
    let [h, m] = time.split(":").map(Number);
    // Handle edge case for midnight (00:00)
    if (h === 0 && m === 0) {
      return "12:00 AM";
    }
    const ampm = h === 24 ? "AM" : h >= 12 ? "PM" : "AM";
    const isNextDay = h === 24;
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm} ${
      isNextDay ? "(Next Day)" : ""
    }`;
  };

  const generateSlots = () => {
    const { startTime, endTime } = formik.values;
    if (!startTime || !endTime) return;
    const start = timeToMinutes(startTime.value);
    const end = timeToMinutes(endTime.value);
    const int = FIXED_INTERVAL; // Use fixed 1 hour interval

    // Handle validation - allow end time to be next day
    if (end <= start && end !== 24 * 60) {
      setSlots([]);
      return;
    }

    const slotsArr = [];
    for (let s = start; s + int <= end; s += int) {
      const slotStart = minutesToTime(s);
      const slotEnd = minutesToTime(s + int);
      slotsArr.push({
        start: slotStart,
        end: slotEnd,
      });
    }
    setSlots(slotsArr);
  };

  const handleCheckboxChange = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSaveSlots = async () => {
    setLoading(true);
    const values = formik.values;
    // Only convert "00:00" to "24:00" for endTime and slot.end
    const normalizeEndTime = (t) => (t === "00:00" ? "24:00" : t);

    const payload = {
      day: data?.day,
      slug: data?.slug,
      type: data?.type,
      startTime: values.startTime?.value, // keep as is
      endTime: normalizeEndTime(values.endTime?.value),
      timeSlots: selectedSlots
        ?.map((slot) => ({
          start: slot.start, // keep as is
          end: normalizeEndTime(slot.end),
        }))
        .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)),
      timezone: moment.tz.guess(),
    };

    const { response } = await Post({
      route: "admin/schedule/create/update",
      data: payload,
    });

    if (response?.status === "success") {
      setStep(3);
      RenderToast({
        type: "success",
        message: t("generateSlotModal.toasts.slotsSavedSuccess"),
      });
    } else {
      RenderToast({
        type: "error",
        message: t("generateSlotModal.toasts.slotsSavedError"),
      });
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    if (step === 3) {
      cb();
    }
    setStep(1);
    setSlots([]);
    setSelectedSlots([]);
    formik.resetForm();
    setShow(false);
  };

  const headerText =
    step === 0
      ? t("generateSlotModal.headers.previousSlots")
      : step === 1
      ? t("generateSlotModal.headers.addNewSlots")
      : step === 2
      ? t("generateSlotModal.headers.generatedSlots")
      : "";

  return (
    <ModalSkeleton
      padding="40px 30px"
      borderRadius="40px"
      maxWidth="586px"
      show={show}
      setShow={setShow}
      headerClass={styles.header}
      onHide={handleClose}
      customHeader={
        step === 3 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className={styles.headerLabel}>
              {t("generateSlotModal.slots")}
            </span>
            <div className={styles.availabilityDate}>
              <p className={styles.date}>{data?.day}</p>
            </div>
          </div>
        ) : (
          <span className={styles.headerLabel}>{headerText}</span>
        )
      }
    >
      <div className={styles.main}>
        {step === 0 && (
          <div className={styles.availability}>
            <div className={styles.availabilityHeader}>
              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>
                  {t("generateSlotModal.startTime")}:
                </span>
                <span className={styles.headerValue}>
                  {previousEvent && formatAMPM(previousEvent?.startTime)}
                </span>
              </div>
              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>
                  {t("generateSlotModal.endTime")}:
                </span>
                <span className={styles.headerValue}>
                  {previousEvent && formatAMPM(previousEvent?.endTime)}
                </span>
              </div>
            </div>
            <div className={styles.availabilityGrid}>
              {previousEvent?.slots?.map((slot, i) => (
                <div key={i} className={styles.slotChip}>
                  <p>
                    {formatAMPM(slot.start)} - {formatAMPM(slot.end)}
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.utcNote}>
              <span>
                <FaClock />{" "}
                {t("generateSlotModal.utcNote") || "All times are in UTC"}
              </span>
            </div>
          </div>
        )}
        {step === 1 && (
          <>
            <DropDown
              isPortal
              label={t("generateSlotModal.startTime")}
              required
              placeholder={t("generateSlotModal.placeholders.selectStartTime")}
              value={formik.values.startTime}
              setValue={(v) => {
                formik.setFieldValue("startTime", v);
                setSlots([]);
                setSelectedSlots([]);
              }}
              options={hourOptions}
              error={formik.errors.startTime}
            />
            <DropDown
              isPortal
              label={t("generateSlotModal.endTime")}
              required
              placeholder={t("generateSlotModal.placeholders.selectEndTime")}
              value={formik.values.endTime}
              setValue={(v) => {
                formik.setFieldValue("endTime", v);
                setSlots([]);
                setSelectedSlots([]);
              }}
              options={endHourOptions}
              error={formik.errors.endTime}
            />
            <div className={styles.intervalInfo}>
              <span className={styles.intervalLabel}>
                {t("generateSlotModal.interval")}:
              </span>
              <span className={styles.intervalValue}>
                1 {t("generateSlotModal.hour")} ({t("generateSlotModal.fixed")})
              </span>
            </div>
            <div className={styles.utcNote}>
              <span>
                ⏰ {t("generateSlotModal.utcNote") || "All times are in UTC"}
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.selectAllContainer}>
              <Button
                label={
                  selectedSlots.length === slots.length
                    ? t("generateSlotModal.btns.deselectAll") || "Deselect All"
                    : t("generateSlotModal.btns.selectAll") || "Select All"
                }
                variant={"outlined"}
                onClick={() => {
                  if (selectedSlots.length === slots.length) {
                    setSelectedSlots([]);
                  } else {
                    setSelectedSlots([...slots]);
                  }
                }}
              />
            </div>
            <div className={styles.slotsList}>
              {slots?.map((slot, i) => (
                <div
                  key={i}
                  className={styles.slotChip}
                  onClick={(e) => {
                    // Only handle click if it's not on the checkbox input or label
                    const isCheckbox =
                      e.target.type === "checkbox" ||
                      e.target.tagName === "LABEL" ||
                      e.target.closest("label") ||
                      e.target.closest('input[type="checkbox"]');
                    if (!isCheckbox) {
                      handleCheckboxChange(slot);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <Checkbox
                    label={`${formatAMPM(slot.start)} - ${formatAMPM(
                      slot.end
                    )}`}
                    value={selectedSlots.includes(slot)}
                    setValue={() => handleCheckboxChange(slot)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <div className={styles.availability}>
            <div className={styles.availabilityHeader}>
              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>
                  {t("generateSlotModal.startTime")}:
                </span>
                <span className={styles.headerValue}>
                  {formik.values.startTime &&
                    formatAMPM(formik.values.startTime.value)}
                </span>
              </div>
              <div className={styles.headerItem}>
                <span className={styles.headerLabel}>
                  {t("generateSlotModal.endTime")}:
                </span>
                <span className={styles.headerValue}>
                  {formik.values.endTime &&
                    formatAMPM(formik.values.endTime.value)}
                </span>
              </div>
            </div>
            <div className={styles.availabilityGrid}>
              {selectedSlots
                ?.sort(
                  (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
                )
                ?.map((slot, i) => (
                  <div key={i} className={styles.slotChip}>
                    <p>
                      {formatAMPM(slot.start)} - {formatAMPM(slot.end)}
                    </p>
                  </div>
                ))}
            </div>
            <div className={styles.utcNote}>
              <span>
                ⏰ {t("generateSlotModal.utcNote") || "All times are in UTC"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={step === 3 ? styles.btnsNOne : styles.btns}>
        {step === 0 && (
          <Button
            label={t("generateSlotModal.btns.editSlots")}
            variant={"primary"}
            onClick={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <Button
            label={t("generateSlotModal.btns.generateSlots")}
            variant={"primary"}
            onClick={formik.handleSubmit}
          />
        )}

        {step === 2 && (
          <>
            <Button
              label={t("generateSlotModal.btns.back")}
              variant={"outlined"}
              onClick={() => setStep(1)}
              disabled={loading}
            />
            <Button
              label={t("generateSlotModal.btns.confirm")}
              variant={"primary"}
              onClick={handleSaveSlots}
              disabled={selectedSlots.length === 0 || loading}
              loading={loading}
              showSpinner={loading}
            />
          </>
        )}
      </div>
    </ModalSkeleton>
  );
}
