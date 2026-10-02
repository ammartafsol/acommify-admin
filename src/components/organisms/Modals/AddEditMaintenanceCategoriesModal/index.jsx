"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { useEffect, useState, useMemo } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import useAxios from "@/interceptor/axios-functions";
import { useFormik } from "formik";
import * as Yup from "yup";
import classes from "./styles.module.css";
import {
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import { languageObject, locales, yupLanguageObject } from "@/i18n";
import { useLocale } from "next-intl";
import useDirection from "@/resources/hooks/useDirection";
import { yupLanguageTranslatedObject } from "@/i18n/routing";

export default function AddEditMaintenanceCategoriesModal({
  show,
  setShow,
  data = null,
  onSave = () => {},
}) {
  const isEdit = !!data;
  const locale = useLocale();
  const direction = useDirection(locale);
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState();
  const { Post, Patch } = useAxios();
  const [selected, setSelected] = useState(locale);
  const [translating, setTranslating] = useState(false);
  const { t, setLocale } = useDynamicTranslations(
    "crudPage.maintenanceCategoriesPage.modal"
  );

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(selected);
  }, [selected, setLocale]);

  // Memoize severity options to prevent unnecessary reinitializations
  const severityOptions = useMemo(
    () => [
      { label: t("severityOptions.high"), value: "high" },
      { label: t("severityOptions.medium"), value: "medium" },
      { label: t("severityOptions.low"), value: "low" },
    ],
    [t]
  );

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return Yup.object({
      name: Yup.object().shape(
        yupLanguageTranslatedObject(t("inputRequired.name"))
      ),
      severity: Yup.object().nullable().required(t("severityRequired")),
      status: Yup.string().required(t("statusRequired")),
    });
  }, [t, selected]);

  const initialValues = {
    name: { ...languageObject },
    severity: null,
    status: "active",
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: false, // Changed to false to prevent unnecessary reinitializations
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  // Reset form when data changes (for edit mode)
  useEffect(() => {
    if (data) {
      formik.setValues({
        name: data?.name || { ...languageObject },
        severity: data?.severity
          ? severityOptions.find((opt) => opt.value === data.severity)
          : null,
        status: data?.status || "active",
      });
    } else {
      formik.resetForm();
    }
  }, [data?.slug]); // Only reset when category actually changes (using slug as identifier)

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  const handleSubmit = async (values) => {
    setLoading("loading");

    const payload = {
      name: values.name,
      severity: values.severity.value,
      status: values.status,
      crudType: "maintenance-request",
    };

    const { response } =
      isEdit && data?.slug
        ? await Patch({
            route: `admin/category/update/${data.slug}`,
            data: payload,
          })
        : await Post({ route: "admin/category/create", data: payload });

    if (response) {
      const message = isEdit
        ? t("toast.categoryUpdated")
        : t("toast.categoryCreated");
      RenderToast({ type: "success", message });
      onSave();
      setShow(false);
      formik.resetForm();
    }
    setLoading("");
  };

  async function translateMessages() {
    const fields = ["name"];
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
        message: `${t("pleaseFill")}: ${missing.join(", ")}`,
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
      message: t("autoFilled"),
    });
  }

  useEffect(() => {
    if (!show) {
      formik.resetForm();
    }
  }, [show]);

  // Update severity option label when language changes
  useEffect(() => {
    if (formik.values.severity?.value) {
      const updatedOption = severityOptions.find(
        (opt) => opt.value === formik.values.severity.value
      );
      if (
        updatedOption &&
        updatedOption.label !== formik.values.severity.label
      ) {
        formik.setFieldValue("severity", updatedOption);
      }
    }
  }, [selected, severityOptions]);

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("editTitle") : t("title")}
    >
      <div
        dir={dir}
        className={mergeClass(
          classes.main,
          dir === "ltr" ? "ignoreRtlNested" : ""
        )}
      >
        <LanguageSelector
          selected={selected}
          setSelected={(newSelected) => {
            setSelected(newSelected);
            setLocale(newSelected);
          }}
          setDirection={setDir}
        />

        <Button
          label={translating ? t("btnTranslate") : t("autoFill")}
          onClick={translateMessages}
          disabled={loading === "submitting" || translating}
        />

        <Input
          dir={dir}
          placeholder={t("categoryNamePlaceholder")}
          label={t("categoryName")}
          value={formik.values.name?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`name.${selected}`, val)}
          errorText={
            formik.touched.name?.[selected] && formik.errors.name?.[selected]
          }
          onBlur={formik.handleBlur}
          disabled={loading === "submitting"}
        />

        <DropDown
          isPortal
          menuPlacement="bottom"
          label={t("severity")}
          placeholder={t("severityPlaceholder")}
          dropDownContainerClass={classes.dropDownContainerClass}
          dir={dir}
          value={formik.values.severity}
          setValue={(val) => formik.setFieldValue("severity", val)}
          options={severityOptions}
          error={formik.touched.severity && formik.errors.severity}
          disabled={loading}
        />

        <DropDown
          isPortal
          label={t("status")}
          menuPlacement="bottom"
          placeholder={t("statusPlaceholder")}
          dropDownContainerClass={classes.dropDownContainerClass}
          dir={dir}
          value={{
            label:
              formik.values.status === "active"
                ? t("statusOptions.active")
                : t("statusOptions.inactive"),
            value: formik.values.status,
          }}
          setValue={(val) => formik.setFieldValue("status", val.value)}
          options={[
            { label: t("statusOptions.active"), value: "active" },
            { label: t("statusOptions.inactive"), value: "inactive" },
          ]}
          error={formik.touched.status && formik.errors.status}
          disabled={loading}
        />

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("cancel")}
            onClick={() => {
              setShow(false);
              formik.resetForm();
            }}
            disabled={loading}
          />
          <Button
            variant="primary"
            label={isEdit ? t("update") : t("save")}
            onClick={() => {
              validateMultiLingualForm({
                fields: ["name"],
                currentLanguage: selected,
                formik: formik,
              });
            }}
            disabled={loading || translating}
            loading={loading}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
