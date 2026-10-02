"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { useEffect, useMemo, useState } from "react";
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
import { languageObject, locales } from "@/i18n";
import { yupLanguageTranslatedObject } from "@/i18n/routing";
import { useLocale } from "next-intl";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";

export default function AddEditMachineCategoriesModal({
  show,
  setShow,
  data = null,
  onSave = () => {},
}) {
  const { t, setLocale } = useDynamicTranslations(
    "crudPage.laundaryMachineCategoriesPage.modal"
  );
  const isEdit = !!data;
  const locale = useLocale();
  const direction = useDirection(locale);
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState("");
  const { Post, Patch } = useAxios();
  const [selected, setSelected] = useState(locale);
  const [translating, setTranslating] = useState(false);

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(selected);
  }, [selected, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return Yup.object({
      name: Yup.object().shape(
        yupLanguageTranslatedObject(t("inputRequired.name"))
      ),
      status: Yup.string().required(t("statusRequired")),
    });
  }, [t, selected]);

  const formik = useFormik({
    initialValues: {
      name: data?.name || { ...languageObject },
      status: data?.status || "active",
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
    if (!show) {
      formik.resetForm();
    }
  }, [show]);

  const handleSubmit = async (values) => {
    setLoading("loading");

    const payload = {
      name: values?.name,
      status: values?.status,
    };

    const route =
      isEdit && data?.slug
        ? `admin/machine/update/${data?.slug}`
        : "admin/machine/create";

    const { response } =
      isEdit && data?.slug
        ? await Patch({ route, data: payload })
        : await Post({ route, data: payload });

    if (response) {
      const message = isEdit
        ? t("MachineUpdatedSuccessfully")
        : t("MachineCreatedSuccessfully");
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
        message: `${t("fill")}: ${missing.join(", ")}`,
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
          label={translating ? t("translating") : t("autoFill")}
          onClick={translateMessages}
          disabled={loading === "submitting" || translating}
        />
        <Input
          dir={dir}
          placeholder={t("machineNamePlaceholder")}
          label={t("machineName")}
          value={formik.values.name?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`name.${selected}`, val)}
          errorText={
            formik.touched.name?.[selected] && formik.errors.name?.[selected]
          }
          disabled={loading === "submitting"}
        />

        <DropDown
          isPortal
          label={t("status")}
          dir={dir}
          menuPlacement="bottom"
          placeholder={t("statusPlaceholder")}
          dropDownContainerClass={classes.dropDownContainerClass}
          value={{
            label:
              formik.values.status === "active" ? t("active") : t("inactive"),
            value: formik.values.status,
          }}
          setValue={(val) => formik.setFieldValue("status", val.value)}
          options={[
            { label: t("active"), value: "active" },
            { label: t("inactive"), value: "inactive" },
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
