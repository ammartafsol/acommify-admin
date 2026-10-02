import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { languageObject, locales } from "@/i18n";
import { yupLanguageTranslatedObject } from "@/i18n/routing";
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
import { useState, useEffect, useMemo } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddEditPositionsModal.module.css";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import * as Yup from "yup";

export default function AddEditPositionsModal({
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
  const { t, setLocale: setDynamicLocale } =
    useDynamicTranslations("positionPage.modal");

  // Sync dynamic locale with selected language
  useEffect(() => {
    setDynamicLocale(selected);
  }, [selected, setDynamicLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return Yup.object({
      name: Yup.object().shape(
        yupLanguageTranslatedObject(t("PositionNameRequired"))
      ),
      status: Yup.string().nullable(),
    });
  }, [t, selected]);

  // Make statusOptions reactive to language changes
  const statusOptions = useMemo(
    () => [
      { label: t("activeOption"), value: "active" },
      { label: t("inactiveOption"), value: "inactive" },
    ],
    [t, selected]
  );

  const formik = useFormik({
    initialValues: {
      name: modalData?.name || { ...languageObject } || "",
      status: modalData?.status || "",
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
    const payload = {
      name: values?.name,
      status: isEdit ? values?.status : "active",
    };

    // editing or creating
    const route = isEdit
      ? `admin/position/update/${modalData?.slug}`
      : "admin/position/create";

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
        message: `${t("PleaseFill")}: ${missing.join(", ")}`,
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
      message: t("translationSuccessMessage"),
    });
    setTranslating(false);
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
            setDynamicLocale(newSelected);
          }}
          setDirection={setDir}
        />
        <Button
          label={translating ? t("translating") : t("autoFill")}
          onClick={translateMessages}
          disabled={loading === "submitting" || translating}
        />
        <Input
          label={
            <>
              {t("PositionName")} <span className={classes.required}>*</span>
            </>
          }
          placeholder={t("PositionNamePlaceholder")}
          value={formik.values.name[selected]}
          setValue={(val) => formik.setFieldValue(`name.${selected}`, val)}
          errorText={
            formik.touched.name?.[selected] && formik.errors.name?.[selected]
          }
          onBlur={formik.handleBlur(`name.${selected}`)}
          dir={dir}
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
            onClick={() => setShow(false)}
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
            // onClick={formik.handleSubmit}
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
