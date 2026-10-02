"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import PhoneInput from "@/components/atoms/PhoneInput/PhoneInput";
import RenderToast from "@/components/atoms/RenderToast";
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
import { GetCountries } from "react-country-state-city";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AddEditBusinessAdminModal.module.css";

export default function AddEditBusinessAdminModal({
  setShow,
  show,
  modalData,
  setModalData,
  onSave = () => {},
}) {
  const { permissions } = useSelector((state) => state.authReducer);
  const { Post, Patch } = useAxios();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(locale);
  const direction = useDirection(locale);
  const isEdit = !!modalData;
  const [dir, setDir] = useState(direction);
  const [translating, setTranslating] = useState(false);
  const { t, setLocale: setDynamicLocale } =
    useDynamicTranslations("businessAdminPage");
  const [countryOptions, setCountryOptions] = useState([]);

  useEffect(() => {
    GetCountries().then((_countries) =>
      setCountryOptions(
        _countries?.map((c) => ({ ...c, label: c.name, value: c.name })),
      ),
    );
  }, []);

  useEffect(() => {
    setDynamicLocale(selected);
  }, [selected, setDynamicLocale]);

  const validationSchema = useMemo(() => {
    return Yup.object({
      centreName: Yup.object().shape(
        yupLanguageTranslatedObject(t("formikSchema.centreNameRequired")),
      ),
      country: Yup.string().required(t("formikSchema.countryRequired")),
      fullName: Yup.object().shape(
        yupLanguageTranslatedObject(t("formikSchema.fullNameRequired")),
      ),
      email: Yup.string()
        .email(t("formikSchema.emailAddress"))
        .required(t("formikSchema.emailRequired")),
      callingCode: Yup.string().required(t("formikSchema.callingRequired")),
      phoneNumber: Yup.string()
        .matches(/^\+?[0-9]{10,15}$/, t("formikSchema.phoneNumberLimit"))
        .required(t("formikSchema.phoneNumberRequired")),
    });
  }, [t, selected]);

  const initialValues = {
    centreName: modalData?.centreName || { ...languageObject },
    country: modalData?.country || "",
    fullName: modalData?.fullName || { ...languageObject },
    email: modalData?.email || "",
    callingCode: modalData?.callingCode || "+44",
    phoneNumber:
      modalData?.phoneNumber != null
        ? (modalData?.callingCode || "") + (modalData?.phoneNumber || "")
        : "",
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => handleSubmit(values),
  });

  console.log(formik.errors);
  // Sync form when modalData changes (edit mode)
  useEffect(() => {
    if (!permissions.includes("add-edit-business-owner")) {
      setShow(false);
      return;
    }
    if (modalData) {
      formik.setValues({
        centreName: modalData?.centreName || { ...languageObject },
        country: modalData?.country || "",
        fullName: modalData?.fullName || { ...languageObject },
        email: modalData?.email || "",
        callingCode: modalData?.callingCode || "+44",
        phoneNumber:
          modalData?.phoneNumber != null
            ? (modalData?.callingCode || "") + (modalData?.phoneNumber || "")
            : "",
      });
    } else {
      formik.resetForm();
    }
  }, [modalData?.slug]);

  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  const handleSubmit = async (values) => {
    setLoading(true);
    const payload = {
      centreName: values.centreName,
      country: values.country,
      fullName: values.fullName,
      email: values.email,
      callingCode: values.callingCode,
      phoneNumber:
        values.phoneNumber
          ?.replace(values.callingCode, "")
          ?.replace(/^\s+|\s+$/g, "") || "",
      userRole: "business-owner",
    };

    const route = isEdit
      ? `admin/user/update/${modalData?.slug}`
      : "admin/user/create";

    const { response } = isEdit
      ? await Patch({ route, data: payload })
      : await Post({ route, data: payload });

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

    setLoading(false);
  };

  async function translateMessages() {
    const fields = ["fullName", "centreName"];
    const missing = fields.filter((field) => !formik.values[field]?.[selected]);
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
          } catch (_err) {}
        }),
      );
    }
    RenderToast({
      type: "success",
      message: t("modal.translationSuccessMessage"),
    });
    setTranslating(false);
  }

  useEffect(() => {
    if (!show) formik.resetForm();
  }, [show]);

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("modal.editStaff") : t("modal.addStaff")}
    >
      <div
        dir={dir}
        className={mergeClass(
          classes.container,
          dir === "ltr" ? "ignoreRtlNested" : "",
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
          label={translating ? t("modal.translating") : t("modal.autoFill")}
          onClick={translateMessages}
          disabled={loading || translating}
        />
        <Input
          label={t("fields.centreName")}
          placeholder={t("fields.centreNamePlaceholder")}
          value={formik.values.centreName?.[selected]}
          setValue={(val) =>
            formik.setFieldValue(`centreName.${selected}`, val)
          }
          errorText={
            formik.touched.centreName?.[selected] &&
            formik.errors.centreName?.[selected]
          }
          onBlur={() => formik.validateForm()}
          dir={dir}
          disabled={loading}
        />
        <DropDown
          label={t("fields.country")}
          placeholder={t("fields.countryPlaceholder")}
          options={countryOptions}
          value={
            countryOptions.find((o) => o.value === formik.values.country) ||
            null
          }
          setValue={(option) => {
            formik.setFieldValue("country", option?.value || "");
            formik.setFieldTouched("country", true, false);
          }}
          error={
            formik.touched.country && formik.errors.country
              ? formik.errors.country
              : ""
          }
          customStyle={{
            height: "59px",
          }}
          dir={dir}
          disabled={loading}
          isSearchable
        />
        <Input
          label={t("fields.name")}
          placeholder={t("fields.namePlaceholder")}
          value={formik.values.fullName?.[selected]}
          setValue={(val) => formik.setFieldValue(`fullName.${selected}`, val)}
          errorText={
            formik.touched.fullName?.[selected] &&
            formik.errors.fullName?.[selected]
          }
          onBlur={() => formik.validateForm()}
          dir={dir}
          disabled={loading}
        />

        <Input
          label={t("fields.email")}
          placeholder={t("fields.emailPlaceholder")}
          type="email"
          value={formik.values.email}
          setValue={(val) => formik.setFieldValue("email", val)}
          errorText={formik.touched.email && formik.errors.email}
          dir={dir}
          disabled={loading || isEdit}
        />

        <PhoneInput
          onCountryChange={(val) => formik.setFieldValue("callingCode", val)}
          placeholder={t("fields.phonePlaceholder")}
          defaultCountry="GB"
          label={t("fields.phone")}
          value={formik.values.phoneNumber}
          setValue={(val) => formik.setFieldValue("phoneNumber", val)}
          errorText={formik.touched.phoneNumber && formik.errors.phoneNumber}
          dir={dir}
          disabled={loading || isEdit}
        />

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("modal.cancel")}
            onClick={() => setShow(false)}
            disabled={loading}
          />
          <Button
            variant="primary"
            label={loading ? t("modal.loading") : t("modal.confirm")}
            disabled={loading}
            loading={loading}
            showSpinner
            onClick={() => {
              validateMultiLingualForm({
                fields: ["fullName", "centreName"],
                currentLanguage: selected,
                formik,
              });
            }}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
