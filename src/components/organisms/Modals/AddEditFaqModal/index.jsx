import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import DropDown from "@/components/molecules/DropDown/DropDown";
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
import classes from "./AddFaqsModal.module.css";

export default function AddEditFaqsModal({
  setShow,
  show,
  modalData,
  setModalData,
  onSave = () => {},
  t: tProp,
}) {
  const { Post, Patch } = useAxios();
  const locale = useLocale();
  const [loading, setLoading] = useState("");
  const [selected, setSelected] = useState(locale);
  const direction = useDirection(locale);
  const isEdit = !!modalData;
  const [dir, setDir] = useState(direction);
  const [translating, setTranslating] = useState(false);
  const { t, setLocale } = useDynamicTranslations("faqPage.modal");

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(selected);
  }, [selected, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      answer: Yup.object().shape(
        yupLanguageTranslatedObject(t("inputRequired.answer"))
      ),
      question: Yup.object().shape(
        yupLanguageTranslatedObject(t("inputRequired.question"))
      ),
      status: Yup.string().nullable(),
    });
  }, [t, selected]);

  const formik = useFormik({
    initialValues: {
      question: modalData?.title || { ...languageObject } || "",
      answer: modalData?.description || { ...languageObject } || "",
      status: modalData?.status || "",
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

  // Make statusOptions reactive to language changes
  const statusOptions = useMemo(
    () => [
      { label: t("activeOption"), value: "active" },
      { label: t("inactiveOption"), value: "inactive" },
    ],
    [t]
  );

  const handleSubmit = async (values) => {
    setLoading("loading");
    const payload = {
      title: values?.question,
      description: values?.answer,
      status: isEdit ? values?.status : values?.status[0],
    };

    // editing or creating
    const route = isEdit
      ? `admin/faqs/update/${modalData?.slug}`
      : "admin/faqs/create";

    // API call
    const { response } = isEdit
      ? await Patch({ route, data: payload })
      : await Post({ route, data: payload });

    if (response) {
      const message = isEdit
        ? t("UpdatedSuccessfully")
        : t("CreatedSuccessfully");

      RenderToast({ type: "success", message });
      onSave();
      setShow(false);
      formik.resetForm();
      setModalData(null);
    }

    setLoading("");
  };

  async function translateMessages() {
    const fields = ["answer", "question"];
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
        message: `${t("PleaseFill")}: ${missing.join(", ")}`,
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
      message: t("translationSuccessMessage"),
    });
  }

  useEffect(() => {
    if (!show) {
      formik.resetForm();
    }
  }, [show]);

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("editTitle") : t("addTitle")}
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
            setLocale(newSelected);
          }}
          setDirection={setDir}
        />
        <Button
          label={translating ? t("translating") : t("autoFill")}
          onClick={translateMessages}
          disabled={loading === "submitting" || translating}
        />
        <Input
          dir={dir}
          label={
            <>
              {t("questionLabel")} <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("questionPlaceholder")}
          value={formik.values.question?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`question.${selected}`, val)}
          errorText={
            formik.touched.question?.[selected] &&
            formik.errors.question?.[selected]
          }
          disabled={loading === "loading"}
        />
        <TextArea
          dir={dir}
          label={
            <>
              {t("answerLabel")} <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("answerPlaceholder")}
          value={formik.values.answer?.[selected] || ""}
          setter={(val) => formik.setFieldValue(`answer.${selected}`, val)}
          errorText={
            formik.touched.answer?.[selected] &&
            formik.errors.answer?.[selected]
          }
          disabled={loading === "loading"}
        />

        {isEdit && (
          <DropDown
            isPortal
            label={t("statusLabel")}
            menuPlacement="bottom"
            placeholder={t("statusPlaceholder")}
            options={statusOptions}
            dir={dir}
            value={statusOptions.find(
              (opt) => opt.value === formik.values.status
            )}
            setValue={(val) => formik.setFieldValue("status", val.value)}
            error={formik.touched.status && formik.errors.status}
            dropDownContainerClass={classes.dropDownContainerClass}
            disabled={loading}
          />
        )}
        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("cancelButton")}
            onClick={() => {
              setShow(false);
              formik.resetForm();
            }}
            disabled={loading}
          />
          <Button
            variant="primary"
            label={
              isEdit
                ? t("updateButton")
                : loading === "loading"
                ? t("saving")
                : t("saveButton")
            }
            disabled={loading === "loading" || translating}
            loading={loading === "loading"}
            showSpinner
            onClick={() => {
              validateMultiLingualForm({
                fields: ["answer", "question"],
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
