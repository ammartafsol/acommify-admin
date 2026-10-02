"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import { useTranslations } from "@/resources/hooks/useTranslations";
import moment from "moment-timezone";
import { useState } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./DateRangeModal.module.css";

export default function DateRangeModal({
  show,
  setShow,
  title,
  loading = false,
  onApply,
}) {
  const t = useTranslations("dateRange");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleApply = () => {
    if (!startDate) {
      RenderToast({
        type: "error",
        message: t("pleaseSelectStartDate"),
      });
      return;
    }

    if (!endDate) {
      RenderToast({
        type: "error",
        message: t("pleaseSelectEndDate"),
      });
      return;
    }

    if (moment(startDate).isAfter(moment(endDate))) {
      RenderToast({
        type: "error",
        message: t("startDateMustBeBeforeEndDate"),
      });
      return;
    }

    // Check if date range is not more than 1 year
    const daysDiff = moment(endDate).diff(moment(startDate), "days");
    if (daysDiff > 365) {
      RenderToast({
        type: "error",
        message: t("dateRangeCannotExceedOneYear"),
      });
      return;
    }

    onApply({
      startDate: startDate,
      endDate: endDate,
    });
  };

  const handleCancel = () => {
    setStartDate("");
    setEndDate("");
    setShow(false);
  };

  return (
    <ModalSkeleton
      header={title || t("selectDateRange")}
      setShow={setShow}
      show={show}
      maxWidth="500px"
    >
      <div className={classes.main}>
        <Input
          label={t("startDate")}
          type="date"
          value={startDate}
          setValue={setStartDate}
          disabled={loading}
          min={moment().subtract(1, "year").format("YYYY-MM-DD")}
          max={
            moment(endDate).subtract(1, "day").format("YYYY-MM-DD") || undefined
          }
        />

        <Input
          label={t("endDate")}
          type="date"
          value={endDate}
          setValue={setEndDate}
          disabled={loading}
          min={startDate || undefined}
          max={moment().format("YYYY-MM-DD")}
        />

        <div className={classes.buttons}>
          <Button
            label={t("cancel")}
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
          />
          <Button
            label={t("apply")}
            variant="primary"
            onClick={handleApply}
            loading={loading}
            disabled={loading}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
