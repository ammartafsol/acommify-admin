import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import { configurationSchema } from "@/formik/schema/configurationSchema";
import { languageObject, locales } from "@/i18n";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import {
  mergeClass,
  translateText,
  validateMultiLingualField,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddEditConfigurationModal.module.css";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";

export default function AddEditConfigurationModal({
  setShow,
  show,
  modalData,
  setModalData,
  onSave = () => {},
}) {
  const { t, setLocale: setLocale1 } =
    useDynamicTranslations("configurationPage");

  const { Post, Patch } = useAxios();
  const locale = useLocale();
  const [loading, setLoading] = useState("");
  const [selected, setSelected] = useState(locale);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return configurationSchema(t);
  }, [t, selected]);
  const direction = useDirection(locale);
  const isEdit = !!modalData;
  const [dir, setDir] = useState(direction);
  const [translating, setTranslating] = useState(false);
  const formik = useFormik({
    initialValues: {
      name: modalData?.name || { ...languageObject },
      ipAddress: modalData?.ip || "",
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      handleSubmit(values);
      //   console.log(values, "values");
    },
  });

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  const handleSubmit = async (values) => {
    setLoading("loading");

    // editing or creating
    const route = isEdit
      ? `admin/ip-address/update/${modalData?.slug}`
      : "admin/ip-address/create";

    // API call
    const method = isEdit ? Patch : Post;
    const { response } = await method({
      route,
      data: {
        name: values.name,
        ip: values.ipAddress,
      },
    });

    if (response) {
      const message = isEdit
        ? t("modal.UpdatedSuccessfully")
        : t("modal.CreatedSuccessfully");

      RenderToast({ type: "success", message });
      onSave();
      setShow(false);
      formik.resetForm();
      setModalData(null);
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
        message: `${t("modal.PleaseFill")}: ${missing.join(", ")}`,
      });
      return;
    }
    setTranslating(true);
    for (const field of fields) {
      const original = formik.values[field]?.[selected] || "";
      await Promise.all(
        locales?.map(async (lang) => {
          if (lang === selected) return;
          try {
            const translated = await translateText(original, lang);
            formik.setFieldValue(`${field}.${lang}`, translated);
          } catch (err) {
            // ignore translation error
          }
        })
      );
    }
    RenderToast({
      type: "success",
      message: t("modal.translationSuccessMessage"),
    });
    setTranslating(false);
  }
  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale1(selected);
  }, [selected, setLocale1]);
  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("modal.editTitle") : t("modal.addTitle")}
    >
      <div
        dir={dir}
        className={mergeClass(
          classes.container,
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
          label={
            <>
              {t("modal.ConfigurationName")}{" "}
              <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("modal.ConfigurationNamePlaceholder")}
          value={formik.values.name?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`name.${selected}`, val)}
          errorText={
            formik.touched.name?.[selected] && formik.errors.name?.[selected]
          }
          dir={dir}
        />

        <Input
          label={
            <>
              {t("modal.ipAddress")} <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("modal.ipAddressPlaceholder")}
          value={formik.values.ipAddress || ""}
          setValue={(val) => formik.setFieldValue(`ipAddress`, val)}
          errorText={formik.touched.ipAddress && formik.errors.ipAddress}
          dir={dir}
        />

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("modal.cancelButton")}
            onClick={() => setShow(false)}
            disabled={loading}
          />
          <Button
            variant="primary"
            label={
              isEdit
                ? t("modal.updateButton")
                : loading === "loading"
                ? t("modal.saving")
                : t("modal.saveButton")
            }
            disabled={loading === "loading"}
            loading={loading === "loading"}
            showSpinner
            onClick={() => {
              validateMultiLingualForm({
                fields: ["name"],
                currentLanguage: selected,
                formik: formik,
              });
            }}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
