"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import { addEditCategorySchema } from "@/formik/schema/addEditCategorySchema";
import { languageObject, locales } from "@/i18n";
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
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./styles.module.css";

export default function AddEditCategoryModal({
  show,
  setShow,
  editCategory = null,
  onSave = () => {},
  onClose = () => {},
}) {
  const { t, setLocale } = useDynamicTranslations("manageItemsPage");
  const isEdit = !!editCategory;
  const { Post, Patch } = useAxios();
  const locale = useLocale();
  const direction = useDirection(locale);
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState("");
  const [activeLanguage, setActiveLanguage] = useState(locale);
  const [translating, setTranslating] = useState(false);

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(activeLanguage);
  }, [activeLanguage, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return addEditCategorySchema(t);
  }, [t, activeLanguage]);

  const formik = useFormik({
    initialValues: {
      name: editCategory?.name || { ...languageObject },
      status: editCategory?.status || "active",
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setLoading("submitting");
      const payload = {
        name: values.name,
        status: values.status,
        crudType: "product",
      };
      const route = isEdit
        ? `admin/category/update/${editCategory?.slug}`
        : "admin/category/create";
      const method = isEdit ? Patch : Post;
      const { response } = await method({ route, data: payload });
      if (response) {
        RenderToast({
          type: "success",
          message: isEdit
            ? t("categoryModal.updatedSuccessfully")
            : t("categoryModal.categoryCreated"),
        });
        setShow(false);
        formik.resetForm();
        onSave();
      }
      setLoading("");
    },
  });

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [activeLanguage, t, validationSchema]);

  useEffect(() => {
    if (!show) {
      formik.resetForm();
    }
  }, [show]);

  async function translateMessages() {
    const fields = ["name"];
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
        message: `${t("pleaseFill")}: ${missing.join(", ")}`,
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
      message: t("modal.toast.translationSuccess"),
    });
  }

  return (
    <ModalSkeleton
      setShow={setShow}
      onHide={() => {
        formik.resetForm();
        onClose();
      }}
      show={show}
      padding="20px 32px"
      header={
        isEdit ? t("categoryModal.editHeader") : t("categoryModal.addHeader")
      }
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
          disabled={loading === "creating" || translating}
        />
        <Input
          dir={dir}
          label={t("categoryModal.categoryName")}
          placeholder={t("categoryModal.categoryNamePlaceholder")}
          value={formik.values.name?.[activeLanguage] || ""}
          setValue={(val) =>
            formik.setFieldValue(`name.${activeLanguage}`, val)
          }
          errorText={
            formik.touched.name?.[activeLanguage] &&
            formik.errors.name?.[activeLanguage]
          }
          disabled={loading === "submitting"}
        />
        <div className={classes.ButtonContainer}>
          <Button
            variant="outlined"
            label={t("modal.cancel")}
            onClick={() => {
              onClose();
              formik.resetForm();
            }}
            disabled={loading === "submitting"}
          />
          <Button
            variant="primary"
            label={isEdit ? t("modal.update") : t("modal.add")}
            onClick={() => {
              validateMultiLingualForm({
                fields: ["name"],
                currentLanguage: activeLanguage,
                formik: formik,
              });
            }}
            disabled={loading === "submitting" || translating}
            loading={loading === "submitting"}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
