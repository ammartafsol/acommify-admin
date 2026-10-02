"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import PhoneInput from "@/components/atoms/PhoneInput/PhoneInput";
import RenderToast from "@/components/atoms/RenderToast";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import { languageObject, locales } from "@/i18n";
import { yupLanguageTranslatedObject } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import {
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddEditHelpLineModal.module.css";

export default function AddEditHelpLineModal({
  show,
  setShow,
  data = null,
  onSave = () => {},
}) {
  const isEdit = !!data;
  const locale = useLocale();
  const direction = useDirection(locale);
  const { Post, Patch } = useAxios();

  const [selected, setSelected] = useState(locale);
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState("");
  const [translating, setTranslating] = useState(false);
  const { t, setLocale } = useDynamicTranslations("crudPage.helpLineCrudPage");

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(selected);
  }, [selected, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      country: Yup.object()
        .shape(yupLanguageTranslatedObject(t("modal.inputRequired.country")))
        .required(t("modal.inputRequired.country")),
      title: Yup.object().shape(
        yupLanguageTranslatedObject(t("modal.inputRequired.title"))
      ),
      description: Yup.object().shape(
        yupLanguageTranslatedObject(t("modal.inputRequired.description"))
      ),
      callingCode: Yup.string().required(t("modal.callingCodeRequired")),
      phoneNumber: Yup.string().required(t("modal.phoneNumberRequired")),
      timings: Yup.string().required(t("modal.timingsRequired")),
    });
  }, [t, selected]);

  const formik = useFormik({
    initialValues: {
      country: data?.country || { ...languageObject },
      title: data?.title || { ...languageObject },
      description: data?.description || { ...languageObject },
      callingCode: data?.callingCode || "44",
      phoneNumber: data?.callingCode + data?.phoneNumber || "",
      timings: data?.timings || "",
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  useEffect(() => {
    if (!show) formik.resetForm();
  }, [show]);

  const handleSubmit = async (values) => {
    setLoading("submitting");

    const payload = {
      country: values.country,
      title: values.title,
      description: values.description,
      callingCode: values.callingCode,
      phoneNumber: values.phoneNumber?.slice(values.callingCode?.length),
      timings: values.timings,
      status: "active",
    };

    const route =
      isEdit && data?.slug
        ? `admin/help-line/update/${data?.slug}`
        : "admin/help-line/create";
    const { response } =
      isEdit && data?.slug
        ? await Patch({ route, data: payload })
        : await Post({ route, data: payload });
    if (response) {
      RenderToast({
        type: "success",
        message: isEdit
          ? t("modal.helpLineUpdatedSuccessfully")
          : t("modal.helpLineCreatedSuccessfully"),
      });
    }

    onSave();
    formik.resetForm();
    setLoading("");
    setShow(false);
  };

  async function translateMessages() {
    const fields = ["title", "description", "country"];
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
        message: `${t("modal.pleaseFill")}: ${missing.join(", ")}`,
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
    RenderToast({ type: "success", message: t("modal.translationSuccess") });
  }
  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      header={isEdit ? t("modal.editTitle") : t("modal.title")}
    >
      <div
        dir={dir}
        className={mergeClass(
          classes.form,
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
          label={translating ? t("modal.translating") : t("modal.autoFill")}
          onClick={translateMessages}
          disabled={loading === "submitting" || translating}
        />

        <Input
          dir={dir}
          label={t("modal.helpLineTitle")}
          placeholder={t("modal.helpLineTitlePlaceholder")}
          value={formik.values.title?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`title.${selected}`, val)}
          errorText={
            formik.touched.title?.[selected] && formik.errors.title?.[selected]
          }
          disabled={loading === "submitting"}
        />
        <Input
          dir={dir}
          label={t("modal.country")}
          placeholder={t("modal.countryPlaceholder")}
          value={formik.values.country?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`country.${selected}`, val)}
          errorText={
            formik.touched.country?.[selected] &&
            formik.errors.country?.[selected]
          }
          disabled={loading === "submitting"}
        />

        <TextArea
          dir={dir}
          label={t("modal.description")}
          placeholder={t("modal.descriptionPlaceholder")}
          value={formik.values.description?.[selected] || ""}
          setter={(val) => formik.setFieldValue(`description.${selected}`, val)}
          errorText={
            formik.touched.description?.[selected] &&
            formik.errors.description?.[selected]
          }
          disabled={loading === "submitting"}
        />

        <PhoneInput
          dir={dir}
          label={t("modal.phoneNumber")}
          value={formik.values.phoneNumber}
          setValue={(val) => formik.setFieldValue("phoneNumber", val)}
          errorText={formik.touched.phoneNumber && formik.errors.phoneNumber}
          onCountryChange={(code) => {
            formik.setFieldValue("callingCode", code);
          }}
          placeholder={t("modal.phoneNumberPlaceholder")}
          disabled={loading === "submitting"}
        />

        <Input
          dir={dir}
          label={t("modal.timings")}
          name="timings"
          placeholder={t("modal.timingsPlaceholder")}
          value={formik.values.timings}
          setValue={(value) => formik.setFieldValue("timings", value)}
          errorText={formik.touched.timings && formik.errors.timings}
          disabled={loading === "submitting"}
        />

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("modal.cancel")}
            onClick={() => {
              setShow(false);
              formik.resetForm();
            }}
            disabled={loading === "submitting"}
          />
          <Button
            variant="primary"
            label={isEdit ? t("modal.update") : t("modal.save")}
            onClick={() => {
              validateMultiLingualForm({
                fields: ["country", "title", "description"],
                currentLanguage: selected,
                formik: formik,
              });
            }}
            loading={loading === "submitting"}
            disabled={loading === "submitting" || translating}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
