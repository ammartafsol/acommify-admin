import Button from "@/components/atoms/Button";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import FileUpload from "@/components/molecules/FileUpload/FileUpload";
import { AddDocumentSchema } from "@/formik/schema/addDocumentSchema";
import { languageObject, locales } from "@/i18n";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import { useLocale } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddDocumentModal.module.css";
import {
  getFileFromKey,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import Input from "@/components/atoms/Input/Input";

export default function AddEditDocumentModal({
  setShow,
  show,
  modalData,
  setModalData,
  onSubmit = () => {},
}) {
  const { t, setLocale: setLocale1 } =
    useDynamicTranslations("documentCenterPage");
  const { Post, Patch } = useAxios();
  const locale = useLocale();
  const [loading, setLoading] = useState("");
  const [selected, setSelected] = useState(locale);
  const direction = useDirection(locale);
  const isEdit = !!modalData;
  const [dir, setDir] = useState(direction);
  const [translating, setTranslating] = useState(false);

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale1(selected);
  }, [selected, setLocale1]);

  // Make documentTypeOptions reactive to language changes
  const documentTypeOptions = useMemo(
    () => [
      { label: t("modal.formsOption"), value: "forms" },
      { label: t("modal.guidelinesOption"), value: "guide-lines" },
      { label: t("modal.othersOption"), value: "other-documents" },
    ],
    [t]
  );

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return AddDocumentSchema(t);
  }, [t, selected]);

  const getInitialDocumentType = () => {
    if (!modalData?.documentType) return null;
    return (
      documentTypeOptions?.find(
        (option) => option.value === modalData?.documentType
      ) || null
    );
  };

  const formik = useFormik({
    initialValues: {
      name: modalData?.name || { ...languageObject },
      document: modalData?.document || null,
      documentType: getInitialDocumentType(),
    },
    enableReinitialize: false,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  // Reset form when modalData changes (for edit mode)
  useEffect(() => {
    if (modalData) {
      const getDocumentType = () => {
        if (!modalData?.documentType) return null;
        return (
          documentTypeOptions?.find(
            (option) => option.value === modalData?.documentType
          ) || null
        );
      };

      formik.setValues({
        name: modalData?.name || { ...languageObject },
        document: modalData?.document || undefined,
        documentType: getDocumentType(),
      });
    } else {
      formik.resetForm();
    }
  }, [modalData?.slug]); // Only reset when document actually changes

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  // Update documentType label when language changes
  useEffect(() => {
    if (formik.values.documentType?.value) {
      const updatedDocumentType = documentTypeOptions.find(
        (d) => d.value === formik.values.documentType.value
      );
      if (
        updatedDocumentType &&
        updatedDocumentType.label !== formik.values.documentType.label
      ) {
        formik.setFieldValue("documentType", updatedDocumentType);
      }
    }
  }, [selected, documentTypeOptions]);

  useEffect(() => {
    if (isEdit && modalData?.document) {
      const fileType = modalData?.document.split(".").pop();
      const blobType =
        fileType === "pdf"
          ? "application/pdf"
          : fileType === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/octet-stream";

      getFileFromKey(
        modalData?.document,
        "document",
        (file) => {
          formik.setFieldValue("document", file);
        },
        blobType
      );
    }
  }, [isEdit, modalData]);

  const handleSubmit = async (values) => {
    setLoading("loading");

    const formData = new FormData();
    for (const lang of Object.keys(languageObject)) {
      formData.append(`name[${lang}]`, values?.name?.[lang] || "");
    }
    formData.append("documentType", values?.documentType?.value);

    if (values?.document) {
      formData.append("documents", values?.document);
    }

    // editing or creating
    const route = isEdit
      ? `admin/document-center/update/${modalData?.slug}`
      : "admin/document-center/create";

    // API call
    const { response } = isEdit
      ? await Patch({ route, data: formData, isFormData: true })
      : await Post({ route, data: formData, isFormData: true });

    if (response) {
      const message = isEdit
        ? t("modal.updatedSuccessfully")
        : t("modal.createdSuccessfully");

      RenderToast({ type: "success", message });
      onSubmit();
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
        message: t("modal.fillRequiredFields"),
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
    <ModalSkeleton
      show={show}
      setShow={setShow}
      header={isEdit ? t("modal.editDocument") : t("modal.addDocument")}
    >
      <div className={classes.main}>
        <LanguageSelector
          selected={selected}
          setSelected={(newSelected) => {
            setSelected(newSelected);
            setLocale1(newSelected);
          }}
          setDirection={setDir}
        />
        <Button
          variant="secondary"
          onClick={translateMessages}
          loading={translating}
          showSpinner={translating}
          disabled={translating}
          className={classes.translateBtn}
          label={t("modal.autofill")}
        />

        <Input
          label={t("modal.documentName")}
          placeholder={t("modal.documentNamePlaceholder")}
          value={formik.values.name?.[selected] || ""}
          setValue={(e) => formik.setFieldValue(`name.${selected}`, e)}
          errorText={
            (formik.touched.name?.[selected] || formik.touched.name) &&
            (formik.errors.name?.[selected] || "")
          }
          dir={dir}
          required
        />

        <DropDown
          isPortal
          dir={dir}
          customStyle={{
            height: "60px",
          }}
          label={t("modal.documentType")}
          placeholder={t("modal.documentTypePlaceholder")}
          value={formik.values.documentType}
          setValue={(value) => formik.setFieldValue("documentType", value)}
          options={documentTypeOptions}
          error={formik.touched.documentType && formik.errors.documentType}
          required
        />

        <FileUpload
          dir={dir}
          label={t("modal.document")}
          file={formik.values.document}
          setFile={(file) => formik.setFieldValue("document", file)}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          error={formik.touched.document && formik.errors.document}
          required={!isEdit}
        />
        <div className={classes.footer}>
          <Button
            onClick={() => setShow(false)}
            variant="secondary"
            className={classes.cancelBtn}
            label={t("modal.cancel")}
            disabled={loading}
          />

          <Button
            // onClick={formik.handleSubmit}
            variant="primary"
            loading={loading === "loading"}
            className={classes.submitBtn}
            label={isEdit ? t("modal.update") : t("modal.create")}
            showSpinner={loading}
            disabled={loading}
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
