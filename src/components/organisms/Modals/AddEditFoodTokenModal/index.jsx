"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import DropDown from "@/components/molecules/DropDown/DropDown";
import Tabs from "@/components/molecules/Tabs/Tabs";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./styles.module.css";

export default function AddEditFoodTokenModal({
  show,
  setShow,
  data = null,
  onSave = () => {},
}) {
  console.log(data, "data");
  const t = useTranslations("foodTokensPage");
  const tabsData = [
    { label: t("modal.tabs.addFoodToken"), value: "addFoodToken" },
    { label: t("modal.tabs.subtractFoodToken"), value: "subtractFoodToken" },
  ];
  const { permissions } = useSelector((state) => state.authReducer);
  const isEdit = !!data;
  const [loading, setLoading] = useState("");
  const [selectedTab, setSelectedTab] = useState(tabsData[0]);
  const locale = useLocale();
  const { Post, Get } = useAxios();
  const [residentsOptions, setResidentsOptions] = useState([]);
  const [activeLanguage, setActiveLanguage] = useState(locale);

  const validationSchema = Yup.object({
    foodToken: Yup.number()
      .required(t("modal.modalFormik.FoodTokenRequired"))
      .min(1, t("modal.modalFormik.FoodTokenGreater")),
    resident: Yup.object().required(t("modal.modalFormik.ResidentRequired")),
  });

  const formik = useFormik({
    initialValues: {
      foodToken: "0",
      resident: null,
    },
    validationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const getResidents = async () => {
    const query = { role: "resident", createFoodToken: isEdit };
    const params = new URLSearchParams(query).toString();
    setLoading("getting");
    const { response } = await Get({ route: `admin/user/all?${params}` });
    if (response) {
      const options = response?.data?.map((resident) => ({
        label: resident.fullName[activeLanguage] || "",
        value: resident.slug,
      }));
      setResidentsOptions(options);
    }
    setLoading("");
  };

  const handleSubmit = async (values) => {
    setLoading("loading");
    const amt = Number(values.foodToken || 0);
    const isSubtract = isEdit && selectedTab?.value === "subtractFoodToken";
    if (isSubtract && Number(data?.totalTokens ?? 0) < amt) {
      RenderToast({
        type: "error",
        message: t("modal.InsufficientTokens"),
      });
      setLoading("");
      return;
    }
    const payload = {
      tokens: isSubtract ? -amt : amt,
      userSlug: values.resident?.value,
    };
    const { response } = await Post({
      route: `admin/food-token/create`,
      data: payload,
    });
    if (response) {
      const message = isEdit
        ? t("modal.updatedFoodToken")
        : t("modal.createdFoodToken");
      RenderToast({ type: "success", message });
      formik.resetForm();
      setShow(false);
      onSave();
      await getResidents();
    }
    setLoading("");
  };

  useEffect(() => {
    if (permissions?.includes?.("view-residents")) getResidents();
  }, []);

  useEffect(() => {
    if (show) setSelectedTab(tabsData[0]);
  }, [show]);

  useEffect(() => {
    if (show && data) {
      formik.setValues({
        foodToken: "",
        resident: { value: data?.user?.slug, label: data.residentName },
      });
    }
  }, [show, data]);

  useEffect(() => {
    if (!show) formik.resetForm();
  }, [show]);

  const subtractMode = isEdit && selectedTab?.value === "subtractFoodToken";

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("modal.editFoodToken") : t("modal.addFoodToken")}
    >
      {loading === "getting" ? (
        <SpinnerLoading />
      ) : (
        <div className={classes.main}>
          {isEdit && (
            <div className={classes.tabContainer}>
              <Tabs
                tabsData={tabsData}
                selected={selectedTab}
                setSelected={setSelectedTab}
              />
            </div>
          )}

          <Input
            type="number"
            placeholder={t("modal.foodTokenAmountPlaceholder")}
            label={t("modal.foodTokenAmount")}
            value={formik.values.foodToken}
            setValue={(val) => formik.setFieldValue("foodToken", val)}
            errorText={formik.touched.foodToken && formik.errors.foodToken}
            disabled={loading === "loading"}
            min={0}
          />

          {isEdit && (
            <p>
              {t("modal.totalFoodToken")} :{" "}
              {Number(data?.availableToken ?? 0) +
                (subtractMode ? -1 : 1) * Number(formik.values.foodToken || 0)}
            </p>
          )}

          <DropDown
            label={t("modal.resident")}
            menuPlacement="bottom"
            placeholder={t("modal.residentPlaceholder")}
            options={residentsOptions}
            value={formik.values.resident}
            setValue={(val) => formik.setFieldValue("resident", val)}
            error={formik.touched.resident && formik.errors.resident}
            dropDownContainerClass={classes.dropDownContainerClass}
            disabled={isEdit}
            isPortal
          />

          <div className={classes.buttonContainer}>
            <Button
              variant="outlined"
              label={t("modal.cancel")}
              onClick={() => setShow(false)}
              disabled={loading === "loading"}
            />
            <Button
              variant="primary"
              label={isEdit ? t("modal.update") : t("modal.save")}
              onClick={formik.handleSubmit}
              disabled={loading === "loading"}
              loading={loading === "loading"}
              showSpinner
            />
          </div>
        </div>
      )}
    </ModalSkeleton>
  );
}
