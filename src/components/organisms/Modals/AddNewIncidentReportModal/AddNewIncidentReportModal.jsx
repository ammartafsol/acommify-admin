"use client";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker/DatePicker";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { addNewIncidentReportSchema } from "@/formik/schema/addNewIncidentReportSchema";
import { languageObject, locales } from "@/i18n";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import {
  isAdminOrBusinessOwner,
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddNewIncidentReportModal.module.css";

export default function AddNewIncidentReportModal({
  show,
  setShow,
  modalData,
  setModalData,
  onSave = () => {},
}) {
  const { user } = useSelector((state) => state.authReducer);
  const locale = useLocale();
  const isEdit = !!modalData;
  const direction = useDirection(locale);
  const [dir, setDir] = useState(direction);
  const { Post, Get, Patch } = useAxios();
  const [loading, setLoading] = useState("");
  const [slug, setSlug] = useState([]);
  const [activeLanguage, setActiveLanguage] = useState(locale);
  const [staff, setStaff] = useState([]);
  const [translating, setTranslating] = useState(false);
  const { t, setLocale } = useDynamicTranslations("incidentReportsPage");

  // Memoize options to prevent unnecessary reinitializations and make them reactive to language changes
  const statusOptions = useMemo(
    () => [
      { label: t("status.resolved"), value: "resolved" },
      { label: t("status.underReview"), value: "under-review" },
      { label: t("status.escalated"), value: "escalated" },
    ],
    [t]
  );

  const severityOptions = useMemo(
    () => [
      { label: t("severityOptions.low"), value: "low" },
      { label: t("severityOptions.medium"), value: "medium" },
      { label: t("severityOptions.high"), value: "high" },
    ],
    [t]
  );

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(activeLanguage);
  }, [activeLanguage, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return addNewIncidentReportSchema(t, user?.role);
  }, [t, activeLanguage, user?.role]);

  const handleSubmit = async (values) => {
    setLoading("submitting");

    const payload = isEdit
      ? {
          status: values?.status?.value,
        }
      : {
          title: values?.title,
          description: values?.description,
          address: values?.location,
          residentSlug: values?.residentInvolved?.value,
          severity: values?.severity?.value,
          completedDate: moment(values?.completedDate),
          status: values?.status?.value,
          staffSlug: isAdminOrBusinessOwner(user?.role)
            ? values?.staff?.value
            : user?.slug,
        };
    // editing or creating

    const route = isEdit
      ? `admin/incident-report/update/${modalData?.slug}`
      : "admin/incident-report/create";

    // API call
    const { response } = isEdit
      ? await Patch({ route, data: payload })
      : await Post({ route, data: payload });

    if (response) {
      const message = isEdit
        ? t("modal.toasts.errorUpdatedReport")
        : t("modal.toasts.reportCreatedSuccessfully");

      RenderToast({ type: "success", message });
      setShow(false);
      formik.resetForm();
      setModalData(null);
      onSave();
    }

    setLoading("");
  };

  const formik = useFormik({
    initialValues: {
      title: modalData?.title || { ...languageObject },
      description: modalData?.description || { ...languageObject },
      location: modalData?.address || { ...languageObject },
      residentInvolved:
        (modalData?.residentInvolved && {
          label: modalData?.residentInvolved.fullName[activeLanguage],
          value: modalData?.residentInvolved.slug,
        }) ||
        null,
      severity:
        severityOptions?.find(
          (option) => option.value === modalData?.severity
        ) || "",
      status:
        statusOptions?.find((option) => option.value === modalData?.status) ||
        null,
      completedDate: modalData?.completedDate
        ? moment(modalData.completedDate).toDate()
        : null,
      staff:
        (modalData?.assignedTo && {
          label: modalData.assignedTo.fullName[activeLanguage],
          value: modalData.assignedTo.slug,
        }) ||
        null,
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: handleSubmit,
  });

  console.log(formik.errors, "formik.errors");

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [activeLanguage, t, validationSchema]);

  // Update status label when language changes
  useEffect(() => {
    if (formik.values.status && formik.values.status.value) {
      const updatedStatus = statusOptions.find(
        (s) => s.value === formik.values.status.value
      );
      if (updatedStatus && updatedStatus.label !== formik.values.status.label) {
        formik.setFieldValue("status", updatedStatus);
      }
    }
  }, [activeLanguage, statusOptions]);

  // Update severity label when language changes
  useEffect(() => {
    if (formik.values.severity && formik.values.severity.value) {
      const updatedSeverity = severityOptions.find(
        (s) => s.value === formik.values.severity.value
      );
      if (
        updatedSeverity &&
        updatedSeverity.label !== formik.values.severity.label
      ) {
        formik.setFieldValue("severity", updatedSeverity);
      }
    }
  }, [activeLanguage, severityOptions]);

  const getResidentsSlug = async () => {
    setLoading("gettingSlug");
    const { response } = await Get({
      route: "admin/user/all?role=resident&status=active",
    });

    if (response) {
      const allSlug = response?.data?.map((user) => ({
        label: user.fullName[activeLanguage],
        value: user?.slug,
      }));
      setSlug(allSlug || []);
    }
    setLoading("");
  };

  const getStaff = async () => {
    setLoading("gettingStaff");
    const query = { purpose: "incident-report", status: "active" };
    const params = new URLSearchParams(query).toString();
    const { response } = await Get({
      route: `admin/staff/assign?${params}`,
    });
    if (response) {
      const allStaffs = response?.data?.map((user) => ({
        label: user?.fullName[activeLanguage],
        value: user?.slug,
      }));
      setStaff(allStaffs || []);
    }
    setLoading("");
  };

  useEffect(() => {
    if (show && !isEdit) {
      getResidentsSlug();
      getStaff();
    } else if (!isEdit) {
      formik.resetForm();
    }
  }, [show]);

  async function translateMessages() {
    const fields = ["title", "description", "location"];
    let missing = [];

    for (const field of fields) {
      const original = formik.values[field]?.[activeLanguage] || "";
      if (!original) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      RenderToast({
        type: "error",

        message: `${t("modal.pleaseFill")}: ${missing.join(", ")}`,
      });
      return;
    }

    setTranslating(true);

    for (const field of fields) {
      const original = formik.values[field]?.[activeLanguage] || "";

      await Promise.all(
        locales.map(async (lang) => {
          if (lang === activeLanguage) return;
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
      message: t("modal.toasts.autoFilledSuccessfully"),
    });
  }

  return (
    <ModalSkeleton
      header={isEdit ? t("modal.editTitle") : t("modal.title")}
      maxWidth="698px"
      padding="20px 32px"
      show={show}
      setShow={setShow}
    >
      <div
        dir={dir}
        className={mergeClass(
          classes.main,
          dir === "ltr" ? "ignoreRtlNested" : ""
        )}
      >
        <LanguageSelector
          selected={activeLanguage}
          setSelected={(newSelected) => {
            setActiveLanguage(newSelected);
            setLocale(newSelected);
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
          label={t("modal.inputLabels.title")}
          placeholder={t("modal.inputPlaceholders.title")}
          value={formik.values.title?.[activeLanguage] || ""}
          setValue={(val) =>
            formik.setFieldValue(`title.${activeLanguage}`, val)
          }
          errorText={
            formik.touched.title?.[activeLanguage] &&
            formik.errors.title?.[activeLanguage]
          }
          onBlur={formik.handleBlur}
          disabled={loading === "submitting" || isEdit}
        />

        <Input
          dir={dir}
          label={t("modal.inputLabels.description")}
          placeholder={t("modal.inputPlaceholders.description")}
          value={formik.values.description?.[activeLanguage] || ""}
          setValue={(val) =>
            formik.setFieldValue(`description.${activeLanguage}`, val)
          }
          errorText={
            formik.touched.description?.[activeLanguage] &&
            formik.errors.description?.[activeLanguage]
          }
          disabled={loading === "submitting" || isEdit}
        />

        <Input
          dir={dir}
          label={t("modal.inputLabels.location")}
          placeholder={t("modal.inputPlaceholders.location")}
          value={formik.values.location?.[activeLanguage]}
          setValue={(val) =>
            formik.setFieldValue(`location.${activeLanguage}`, val)
          }
          errorText={
            formik.touched.location?.[activeLanguage] &&
            formik.errors.location?.[activeLanguage]
          }
          disabled={loading === "submitting" || isEdit}
        />
        <DropDown
          isPortal
          dir={dir}
          dropDownContainerClass={classes.dropdownClass}
          options={severityOptions}
          label={t("modal.inputLabels.severity")}
          placeholder={t("modal.inputPlaceholders.severity")}
          value={formik.values.severity}
          setValue={(val) => {
            formik.setFieldValue("severity", val);
          }}
          error={formik.touched.severity && formik.errors.severity}
          disabled={loading === "submitting" || isEdit}
        />

        <DropDown
          isPortal
          dir={dir}
          options={slug}
          label={t("modal.inputLabels.residentInvolved")}
          placeholder={t("modal.inputPlaceholders.residentInvolved")}
          value={formik.values.residentInvolved}
          setValue={(val) => {
            formik.setFieldValue("residentInvolved", val);
          }}
          dropDownContainerClass={classes.dropdownClass}
          error={
            formik.touched.residentInvolved && formik.errors.residentInvolved
          }
          disabled={loading === "submitting" || isEdit}
        />

        {/* staff */}
        {isAdminOrBusinessOwner(user?.role) && (
          <DropDown
            isPortal
            dir={dir}
            options={staff}
            label={t("modal.inputLabels.reportedBy")}
            placeholder={t("modal.inputPlaceholders.reportedBy")}
            value={formik.values.staff}
            setValue={(val) => {
              formik.setFieldValue("staff", val);
            }}
            dropDownContainerClass={classes.dropdownClass}
            error={formik.touched.staff && formik.errors.staff}
            disabled={loading === "submitting" || isEdit}
          />
        )}

        <DropDown
          isPortal
          dir={dir}
          options={statusOptions}
          label={t("modal.inputLabels.status")}
          placeholder={t("modal.inputPlaceholders.status")}
          dropDownContainerClass={classes.dropdownClass}
          value={formik.values.status}
          setValue={(val) => formik.setFieldValue("status", val)}
          error={formik.touched.status && formik.errors.status}
        />

        {formik.values.status?.value === "resolved" && (
          <DatePicker
            dir={dir}
            label={t("modal.inputLabels.completedDate")}
            placeholderText={t("modal.inputPlaceholders.completedDate")}
            value={formik.values.completedDate}
            setValue={(val) => formik.setFieldValue("completedDate", val)}
            errorText={
              formik.touched.completedDate && formik.errors.completedDate
            }
            disabled={
              loading === "submitting" ||
              (modalData?.status === "resolved" && modalData?.completedDate)
            }
            maxDate={moment().toDate()}
          />
        )}
        <div className={classes.btns}>
          <Button
            label={t("modal.modalBtnsLabel.cancel")}
            variant={"outlined"}
            onClick={() => {
              setShow(false);
              formik.resetForm();
            }}
            disabled={loading === "submitting"}
          />

          <Button
            variant="primary"
            label={t("modal.modalBtnsLabel.submit")}
            type="submit"
            showSpinner
            onClick={() => {
              validateMultiLingualForm({
                fields: ["title", "description", "location"],
                currentLanguage: activeLanguage,
                formik: formik,
              });
            }}
            disabled={loading === "submitting" || translating}
            loading={loading === "submitting"}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
