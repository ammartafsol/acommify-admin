"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import MultiDatePicker from "@/components/atoms/MultiDatePicker/MultiDatePicker";
import RenderToast from "@/components/atoms/RenderToast";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import DropDown from "@/components/molecules/DropDown/DropDown";
import addEditBusSchema from "@/formik/schema/addEditBusSchema";
import { languageObject, locales } from "@/i18n";
import { yupTouchedObject } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import {
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { DateObject } from "react-multi-date-picker";
import UploadMedia from "../../UploadMedia";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddEditBusModal.module.css";

export default function AddEditBusModal({
  show,
  setShow,
  title,
  data,
  onSave,
}) {
  const { t, setLocale: setLocale1 } =
    useDynamicTranslations("busManagementPage");

  const locale = useLocale();
  const direction = useDirection(locale);
  const [selected, setSelected] = useState(locale);
  const [dir, setDir] = useState(direction);
  const today = new DateObject().format("YYYY-MM-DD");
  const { Post, Patch } = useAxios();
  const [loading, setLoading] = useState("");
  const isEdit = Boolean(data);
  const [translating, setTranslating] = useState(false);

  // Memoize options to prevent unnecessary reinitializations
  const capacityOptions = useMemo(
    () => [
      { label: `8 ${t("modal.seater")}`, value: 8 },
      { label: `11 ${t("modal.seater")}`, value: 11 },
      { label: `13 ${t("modal.seater")}`, value: 13 },
      { label: `15 ${t("modal.seater")}`, value: 15 },
      { label: `36 ${t("modal.seater")}`, value: 36 },
      { label: `53 ${t("modal.seater")}`, value: 53 },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { label: t("busStatus.active"), value: "active" },
      { label: t("busStatus.inactive"), value: "inactive" },
    ],
    [t]
  );

  const shiftOptions = useMemo(
    () => [
      { label: t("shiftOptions.morning"), value: "morning" },
      { label: t("shiftOptions.afternoon"), value: "afternoon" },
      { label: t("shiftOptions.evening"), value: "evening" },
      { label: t("shiftOptions.night"), value: "night" },
    ],
    [t]
  );

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale1(selected);
  }, [selected, setLocale1]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return addEditBusSchema(t);
  }, [t, selected]);

  const initialValues = {
    busName: data?.name || { ...languageObject },
    busNumber: data?.busId || "",
    description: data?.description || { ...languageObject },
    startLocation: data?.startingPointAddress || { ...languageObject },
    endLocation: data?.endingPointAddress || { ...languageObject },
    capacity:
      capacityOptions?.find((option) => option.value === data?.capacity) ||
      null,
    startTime: data?.schedule?.startTime
      ? moment(data.schedule.startTime, "hh:mm A").format("HH:mm")
      : "",
    endTime: data?.schedule?.endTime
      ? moment(data.schedule.endTime, "hh:mm A").format("HH:mm")
      : "",
    availableDates: data?.schedule?.availableDates
      ? data.schedule.availableDates
          .filter((date) => date >= today)
          .map((date) => new DateObject({ date, format: "YYYY-MM-DD" }))
      : [],
    shift: shiftOptions?.find((option) => option.value === data?.shift) || null,
    status:
      statusOptions?.find((option) => option.value === data?.status) || null,
    document: data?.document ? [{ url: data.document }] : [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: false, // Changed to false to prevent unnecessary reinitializations
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      createBusHandler(values);
    },
  });

  // Reset form when data changes (for edit mode)
  useEffect(() => {
    if (data) {
      formik.setValues({
        busName: data?.name || { ...languageObject },
        busNumber: data?.busId || "",
        description: data?.description || { ...languageObject },
        startLocation: data?.startingPointAddress || { ...languageObject },
        endLocation: data?.endingPointAddress || { ...languageObject },
        capacity:
          capacityOptions?.find((option) => option.value === data?.capacity) ||
          null,
        startTime: data?.schedule?.startTime
          ? moment(data.schedule.startTime, "hh:mm A").format("HH:mm")
          : "",
        endTime: data?.schedule?.endTime
          ? moment(data.schedule.endTime, "hh:mm A").format("HH:mm")
          : "",
        availableDates: data?.schedule?.availableDates
          ? data.schedule.availableDates
              .filter((date) => date >= today)
              .map((date) => new DateObject({ date, format: "YYYY-MM-DD" }))
          : [],
        shift:
          shiftOptions?.find((option) => option.value === data?.shift) || null,
        status:
          statusOptions?.find((option) => option.value === data?.status) ||
          null,
        document: data?.document ? [{ url: data.document }] : [],
      });
    } else {
      formik.resetForm();
    }
  }, [data?.slug]); // Only reset when bus actually changes (using slug as identifier)

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  const createBusHandler = async (values) => {
    setLoading("loading");

    let documentUrl = "";

    // Upload media files first if any
    if (
      values.document &&
      values.document.length > 0 &&
      values.document[0] instanceof File
    ) {
      const formData = new FormData();
      formData.append("docs", values.document[0]);
      const { response } = await Post({
        route: "media/upload",
        data: formData,
        isFormData: true,
      });
      console.log("Upload response:", response);
      if (response && response.data?.docs) {
        documentUrl = response.data.docs[0]?.key;
      }
    }

    const filteredDates = values.availableDates
      .map((d) => d.format("YYYY-MM-DD"))
      .filter((date) => date >= today);
    const payload = {
      name: values.busName,
      busNumber: values.busNumber,
      description: values.description,
      startingPointAddress: values.startLocation,
      endingPointAddress: values.endLocation,
      startTime: values.startTime,
      endTime: values.endTime,
      capacity: values.capacity?.value,
      availableDates: filteredDates,
      shift: values.shift?.value,
      status: "active",
      startingPointLatitude: 0,
      startingPointLongitude: 0,
      endingPointLatitude: 0,
      endingPointLongitude: 0,
      ...(documentUrl && { document: documentUrl }),
      timezone: moment.tz.guess(),
    };

    const method = isEdit ? Patch : Post;
    const route = isEdit
      ? `admin/bus/update/${data?.slug}`
      : "admin/bus/create";
    const { response } = await method({
      route: route,
      data: payload,
    });

    if (response) {
      const message = isEdit
        ? t("modal.toasts.busUpdated")
        : t("modal.toasts.busCreated");

      RenderToast({ type: "success", message });
      onSave();
      setShow(false);
      formik.resetForm();
    }

    setLoading("");
  };

  function shiftFromTime(time) {
    if (!time) return null;
    const hour = parseInt(time.split(":")[0], 10);
    if (hour >= 5 && hour < 12) {
      return shiftOptions.find((s) => s.value === "morning");
    }
    if (hour >= 12 && hour < 17) {
      return shiftOptions.find((s) => s.value === "afternoon");
    }
    if (hour >= 17 && hour < 21) {
      return shiftOptions.find((s) => s.value === "evening");
    }
    return shiftOptions.find((s) => s.value === "night");
  }

  function handleStartTimeChange(value) {
    formik.setFieldValue("startTime", value);
    const endTime = formik.values.endTime;
    if (endTime && endTime <= value) {
      formik.setFieldValue("endTime", "");
      formik.setFieldValue("shift", null);
      return;
    }
    if (endTime) formik.setFieldValue("shift", shiftFromTime(endTime));
  }

  function handleEndTimeChange(value) {
    formik.setFieldValue("endTime", value);
    formik.setFieldValue("shift", shiftFromTime(value));
  }

  async function translateMessages() {
    const fields = ["busName", "description", "startLocation", "endLocation"];
    let missing = [];

    for (const field of fields) {
      const original = formik.values[field]?.[selected] || "";
      if (!original) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      RenderToast({
        type: "error",
        message: `${t("modal.toasts.pleaseFill")}: ${missing.join(", ")}`,
      });
      return;
    }

    setTranslating(true);

    for (const field of fields) {
      const original = formik.values[field]?.[selected] || "";

      await Promise.all(
        locales.map(async (lang) => {
          if (lang === selected) return;
          try {
            const translated = await translateText(original, lang);
            formik.setFieldValue(`${field}.${lang}`, translated);
          } catch (err) {
            // ignore translation errors
          }
        })
      );
    }

    setTranslating(false);
    RenderToast({
      type: "success",
      message: t("modal.translationSuccessMessage"),
    });
  }

  return (
    <>
      {/* <style>
        {`
        .modal.show .modal-dialog {
        max-width: 698px !important;
        }
        `}
      </style> */}
      <ModalSkeleton
        header={data ? t("modal.editTitle") : title}
        setShow={setShow}
        show={show}
        maxWidth="698px"
      >
        <div
          className={mergeClass(
            classes.main,
            dir === "ltr" ? "ignoreRtlNested" : ""
          )}
        >
          <LanguageSelector
            selected={selected}
            setSelected={(newSelected) => {
              setSelected(newSelected);
              setLocale1(newSelected);
            }}
            setDirection={setDir}
          />
          <Button
            label={translating ? t("modal.translating") : t("modal.autoFill")}
            onClick={translateMessages}
            disabled={loading === "submitting" || translating}
          />
          <Input
            dir={dir}
            label={t("modal.inputLabels.busName")}
            placeholder={t("modal.inputPlaceholders.busName")}
            value={formik.values.busName?.[selected] || ""}
            setValue={(value) =>
              formik.setFieldValue(`busName.${selected}`, value)
            }
            errorText={
              (formik.touched.busName?.[selected] || formik.touched.busName) &&
              (formik.errors.busName?.[selected] || "")
            }
          />

          <TextArea
            dir={dir}
            label={t("modal.inputLabels.description")}
            placeholder={t("modal.inputPlaceholders.description")}
            value={formik.values.description?.[selected] || ""}
            rows={5}
            setter={(value) =>
              formik.setFieldValue(`description.${selected}`, value)
            }
            errorText={
              formik.touched.description?.[selected] &&
              formik.errors.description?.[selected]
            }
          />

          <Input
            dir={dir}
            label={t("modal.inputLabels.busNumber")}
            placeholder={t("modal.inputPlaceholders.busNumber")}
            value={formik.values.busNumber}
            disabled={isEdit}
            setValue={(value) => formik.setFieldValue("busNumber", value)}
            errorText={formik.touched.busNumber && formik.errors.busNumber}
          />

          <Input
            dir={dir}
            label={t("modal.inputLabels.startLocation")}
            placeholder={t("modal.inputPlaceholders.startLocation")}
            value={formik.values.startLocation?.[selected] || ""}
            setValue={(value) =>
              formik.setFieldValue(`startLocation.${selected}`, value)
            }
            errorText={
              formik.touched.startLocation?.[selected] &&
              formik.errors.startLocation?.[selected]
            }
          />
          <Input
            dir={dir}
            label={t("modal.inputLabels.endLocation")}
            placeholder={t("modal.inputPlaceholders.endLocation")}
            value={formik.values.endLocation?.[selected] || ""}
            setValue={(value) => {
              formik.setFieldValue(`endLocation.${selected}`, value);
              formik.setTouched((prev) => ({
                ...prev,
                endLocation: yupTouchedObject,
              }));
            }}
            errorText={
              formik.touched.endLocation?.[selected] &&
              formik.errors.endLocation?.[selected]
            }
          />

          <DropDown
            isPortal
            dir={dir}
            label={t("modal.inputLabels.capacity")}
            placeholder={t("modal.inputPlaceholders.capacity")}
            value={formik.values.capacity}
            options={capacityOptions}
            dropDownContainerClass={classes.dropDownContainer}
            setValue={(value) => formik.setFieldValue("capacity", value)}
            error={formik.touched.capacity && formik.errors.capacity}
            disabled={isEdit}
          />

          <Input
            dir={dir}
            label={t("modal.inputLabels.startTime")}
            type="time"
            placeholder={t("modal.inputPlaceholders.startTime")}
            value={formik.values.startTime}
            setValue={handleStartTimeChange}
            errorText={formik.touched.startTime && formik.errors.startTime}
            inputContainerClass={classes.inputDateContainer}
            disabled={isEdit}
          />

          <Input
            dir={dir}
            label={t("modal.inputLabels.endTime")}
            placeholder={t("modal.inputPlaceholders.endTime")}
            value={formik.values.endTime}
            type="time"
            min={formik.values.startTime || undefined}
            setValue={handleEndTimeChange}
            errorText={formik.touched.endTime && formik.errors.endTime}
            inputContainerClass={classes.inputDateContainer}
            disabled={isEdit || !formik.values.startTime}
          />

          <DropDown
            isPortal
            dir={dir}
            label={t("modal.inputLabels.shift")}
            placeholder={t("modal.inputPlaceholders.shift")}
            value={formik.values.shift}
            options={shiftOptions}
            dropDownContainerClass={classes.dropDownContainer}
            setValue={(value) => formik.setFieldValue("shift", value)}
            error={formik.touched.shift && formik.errors.shift}
            disabled={true}
          />

          <MultiDatePicker
            dir={dir}
            value={formik.values.availableDates}
            onChange={(dates) => formik.setFieldValue("availableDates", dates)}
            error={
              formik.touched.availableDates && formik.errors.availableDates
            }
            label={t("modal.inputLabels.availableDates")}
            placeholder={t("modal.inputPlaceholders.availableDates")}
            minDate={new DateObject()}
          />

          <div className={classes.uploadSection} dir={dir}>
            <label className={classes.uploadLabel}>
              {t("modal.inputLabels.document")}
            </label>
            <UploadMedia
              locale={selected}
              files={formik.values.document}
              handleFileChange={(files) =>
                formik.setFieldValue("document", files)
              }
              handleRemoveFile={(index) => {
                const newFiles = [...formik.values.document];
                newFiles.splice(index, 1);
                formik.setFieldValue("document", newFiles);
              }}
              error={formik.touched.document && formik.errors.document}
              multiple={false}
              accept="pdf/*"
              maxFiles={1}
              uploadMessage={t("modal.uploadMessage.document")}
              fileFormats={t("modal.fileFormats.document")}
              maxSizeMB={5}
              dir={dir}
            />
          </div>

          <div
            className={mergeClass(
              classes.btns,
              dir === "rtl" ? classes.rtl : ""
            )}
          >
            <Button
              label={t("modal.btnLabels.cancel")}
              variant={"outlined"}
              onClick={() => {
                setShow(false);
                formik.resetForm();
              }}
            />
            <Button
              label={
                isEdit
                  ? t("modal.btnLabels.update")
                  : t("modal.btnLabels.create")
              }
              variant={"primary"}
              onClick={() => {
                validateMultiLingualForm({
                  fields: [
                    "busName",
                    "description",
                    "startLocation",
                    "endLocation",
                  ],
                  currentLanguage: selected,
                  formik: formik,
                });
              }}
              loading={loading === "loading"}
              disabled={loading === "loading"}
              showSpinner
            />
          </div>
        </div>
      </ModalSkeleton>
    </>
  );
}
