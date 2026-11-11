"use client";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker/DatePicker";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { languageObject, locales } from "@/i18n";
import { yupLanguageTranslatedObject } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useTranslations } from "@/resources/hooks/useTranslations";
import {
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import * as Yup from "yup";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddEditHolidayModal.module.css";

const pad = (n) => String(n).padStart(2, "0");
const toDay = (date) =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : "";
const fromDay = (day) => {
  const [y, m, d] = (day || "").split("-").map(Number);
  return y ? new Date(y, m - 1, d) : null;
};

/** Add / edit a holiday (HOL) or bank holiday (B/HOL). */
export default function AddEditHolidayModal({
  show,
  setShow,
  modalData,
  onSave = () => {},
  holidays = [], // other holidays this year: marked on the calendar
}) {
  const t = useTranslations("holidaysPage.modal");
  const tTypes = useTranslations("holidaysPage.types");
  const { Post, Patch } = useAxios();
  const locale = useLocale();
  const direction = useDirection(locale);
  const isEdit = !!modalData;
  const [selected, setSelected] = useState(locale);
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);

  const typeOptions = [
    { label: `HOL · ${tTypes("holiday")}`, value: "holiday" },
    { label: `B/HOL · ${tTypes("bank-holiday")}`, value: "bank-holiday" },
  ];
  const statusOptions = [
    { label: t("active"), value: "active" },
    { label: t("inactive"), value: "inactive" },
  ];

  const validationSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.object().shape(yupLanguageTranslatedObject(t("nameRequired"))),
        date: Yup.date().nullable().required(t("dateRequired")),
        type: Yup.string().required(t("typeRequired")),
      }),
    [selected],
  );

  const formik = useFormik({
    initialValues: {
      name: modalData?.name ? { ...languageObject, ...modalData.name } : { ...languageObject },
      date: fromDay(modalData?.date),
      type: modalData?.type || "",
      status: modalData?.status || "active",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const payload = {
        name: values.name,
        date: toDay(values.date),
        type: values.type,
        ...(isEdit && { status: values.status }),
      };
      const { response } = isEdit
        ? await Patch({ route: `holidays/update/${modalData._id}`, data: payload })
        : await Post({ route: "holidays/create", data: payload });
      if (response) {
        RenderToast({ type: "success", message: isEdit ? t("updated") : t("created") });
        onSave();
        setShow(false);
      }
      setLoading(false);
    },
  });

  async function autoFill() {
    const original = formik.values.name?.[selected] || "";
    if (!original) {
      RenderToast({ type: "error", message: t("fillName") });
      return;
    }
    setTranslating(true);
    await Promise.all(
      locales.map(async (lang) => {
        if (lang === selected) return;
        try {
          formik.setFieldValue(`name.${lang}`, await translateText(original, lang));
        } catch {
          // keep what the user typed if a translation fails
        }
      }),
    );
    RenderToast({ type: "success", message: t("autoFilled") });
    setTranslating(false);
  }

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      padding="20px 32px"
      header={isEdit ? t("editTitle") : t("addTitle")}
    >
      <div
        dir={dir}
        className={mergeClass(classes.container, dir === "ltr" ? "ignoreRtlNested" : "")}
      >
        <LanguageSelector selected={selected} setSelected={setSelected} setDirection={setDir} />
        <Button
          label={translating ? t("translating") : t("autoFill")}
          onClick={autoFill}
          disabled={loading || translating}
        />

        <Input
          label={
            <>
              {t("name")} <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("namePlaceholder")}
          value={formik.values.name[selected]}
          setValue={(val) => formik.setFieldValue(`name.${selected}`, val)}
          errorText={formik.touched.name?.[selected] && formik.errors.name?.[selected]}
          onBlur={formik.handleBlur(`name.${selected}`)}
          dir={dir}
        />

        <DatePicker
          dir={dir}
          label={
            <>
              {t("date")} <span className={classes.required}>*</span>
            </>
          }
          placeholderText={t("datePlaceholder")}
          value={formik.values.date}
          setValue={(val) => formik.setFieldValue("date", val)}
          errorText={formik.touched.date && formik.errors.date}
          disabled={loading}
          popperPlacement="bottom-start"
          // Rendered outside the modal so the modal never cuts the calendar off
          portalId="holiday-datepicker-portal"
          calendarClassName={classes.calendar}
          popperClassName={classes.popper}
          calendarStartDay={1}
          todayButton={t("today")}
          formatWeekDay={(name) => name.slice(0, 2)}
          highlightDates={[
            {
              [classes.takenDay]: holidays
                .filter((h) => h._id !== modalData?._id)
                .map((h) => fromDay(h.date)),
            },
          ]}
          dayClassName={(d) =>
            d.getDay() === 0 || d.getDay() === 6 ? classes.weekendDay : undefined
          }
          renderDayContents={(dayNum, date) => {
            const taken = holidays.find(
              (h) => h._id !== modalData?._id && h.date === toDay(date),
            );
            return (
              <span title={taken ? taken.name?.[locale] || taken.name?.en : undefined}>
                {dayNum}
              </span>
            );
          }}
          renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
            <div className={classes.calHeader}>
              <button type="button" onClick={decreaseMonth} aria-label={t("previousMonth")}>
                <IoChevronBack size={16} className={classes.flipRtl} />
              </button>
              <div>
                <strong>{date.toLocaleDateString(locale, { month: "long" })}</strong>
                <span>{date.getFullYear()}</span>
              </div>
              <button type="button" onClick={increaseMonth} aria-label={t("nextMonth")}>
                <IoChevronForward size={16} className={classes.flipRtl} />
              </button>
            </div>
          )}
        />

        <DropDown
          isPortal
          label={
            <>
              {t("type")} <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("typePlaceholder")}
          options={typeOptions}
          dir={dir}
          isSearchable={false}
          value={typeOptions.find((o) => o.value === formik.values.type) || null}
          setValue={(val) => formik.setFieldValue("type", val?.value || "")}
          error={formik.touched.type && formik.errors.type}
          disabled={loading}
        />

        {isEdit && (
          <DropDown
            isPortal
            label={t("status")}
            options={statusOptions}
            dir={dir}
            isSearchable={false}
            value={statusOptions.find((o) => o.value === formik.values.status)}
            setValue={(val) => formik.setFieldValue("status", val?.value || "active")}
            disabled={loading}
          />
        )}

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("cancel")}
            onClick={() => setShow(false)}
            disabled={loading}
          />
          <Button
            variant="primary"
            label={loading ? t("saving") : isEdit ? t("update") : t("save")}
            loading={loading}
            showSpinner
            disabled={loading}
            onClick={() => {
              formik.setTouched({ name: { [selected]: true }, date: true, type: true });
              validateMultiLingualForm({ fields: ["name"], currentLanguage: selected, formik });
            }}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
