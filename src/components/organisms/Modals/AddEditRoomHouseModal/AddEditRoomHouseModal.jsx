"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { addEditRoomSchema } from "@/formik/schema/addEditRoomSchema";
import useAxios from "@/interceptor/axios-functions";
import { capitalizeEachWord } from "@/resources/utils/helper";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./styles.module.css";
import { useTranslations } from "@/resources/hooks/useTranslations";

export default function AddEditRoomHouseModal({
  show,
  setShow,
  data = null,
  onSave = () => {},
}) {
  const t = useTranslations("roomsHouses.modal");
  const isEdit = !!data;
  const [loading, setLoading] = useState("");
  const { Post, Patch } = useAxios();

  const typeOptions = [
    { label: t("houseTypeLabels.house"), value: "house" },
    { label: t("houseTypeLabels.room"), value: "room" },
    { label: t("houseTypeLabels.apartment"), value: "apartment" },
  ];

  const userTypeOptions = [
    { label: t("userTypeLabels.resident"), value: "resident" },
    { label: t("userTypeLabels.visitor"), value: "visitor" },
  ];

  const formik = useFormik({
    initialValues: {
      accommodationNumber: data?.accommodationNumber || "",
      noOfBeds: data?.noOfBeds || "1",
      type: data?.type
        ? typeOptions.find((opt) => opt.value === data.type)
        : null,
      userType: data?.userType
        ? userTypeOptions.find((opt) => opt.value === data.userType)
        : null,
    },
    enableReinitialize: true,
    validationSchema: addEditRoomSchema(t),
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  useEffect(() => {
    if (!show) {
      formik.resetForm();
    }
  }, [show]);

  const handleSubmit = async (values) => {
    setLoading("loading");
    const payload = {
      ...(values?.userType?.value === "resident" && {
        noOfBeds: Number(values.noOfBeds),
      }),
      ...(!isEdit && data?.status && { status: data?.status }),
      accommodationNumber: values.accommodationNumber,
      ...(!isEdit && {
        type: values.type.value,
        userType: values.userType.value,
      }),
    };
    const API = isEdit ? Patch : Post;
    const { response } = await API({
      route: `admin/accommodation/${isEdit ? `update/${data.slug}` : "create"}`,
      data: payload,
    });
    if (response?.status === "success") {
      RenderToast({
        type: "success",
        message: isEdit ? t("updatedSuccessfully") : t("createdSuccessfully"),
      });
      setShow(false);
      formik.resetForm();
      onSave();
    }
    setLoading("");
  };

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("editRoomHouse") : t("createRoomHouse")}
    >
      <div className={classes.main}>
        <Input
          label={t("houseRoomNumber")}
          placeholder={t("houseRoomNumberPlaceholder")}
          value={formik.values.accommodationNumber}
          setValue={(val) => formik.setFieldValue("accommodationNumber", val)}
          errorText={
            formik.touched.accommodationNumber &&
            formik.errors.accommodationNumber
          }
          disabled={loading}
          onBlur={formik.handleBlur}
        />

        <DropDown
          isPortal
          label={t("accommodationType")}
          placeholder={t("accommodationTypePlaceholder")}
          dropDownContainerClass={classes.dropDownContainerClass}
          value={formik.values.type}
          setValue={(val) => formik.setFieldValue("type", val)}
          options={typeOptions}
          error={formik.touched.type && formik.errors.type}
          disabled={loading || isEdit}
        />
        <DropDown
          isPortal
          label={t("userType")}
          placeholder={t("userTypePlaceholder")}
          dropDownContainerClass={classes.dropDownContainerClass}
          value={formik.values.userType}
          setValue={(val) => formik.setFieldValue("userType", val)}
          options={userTypeOptions}
          error={formik.touched.userType && formik.errors.userType}
          disabled={loading || isEdit}
        />
        {formik?.values?.userType?.value === "resident" && (
          <Input
            label={t("numberOfBeds")}
            placeholder={t("numberOfBedsPlaceholder")}
            type="number"
            value={formik.values.noOfBeds}
            setValue={(val) => formik.setFieldValue("noOfBeds", val)}
            errorText={formik.touched.noOfBeds && formik.errors.noOfBeds}
            // disabled={loading || (isEdit && data?.occupancyStatus === "unoccupied")}
            disabled={
              loading || (isEdit && data?.occupancyStatus !== "unoccupied")
            }
            min={1}
          />
        )}

        {/* {isEdit && (
          <Input
            label={t("occupancyStatus")}
            placeholder={t("occupancyStatusPlaceholder")}
            value={capitalizeEachWord(data?.occupancyStatus || "")}
            disabled
          />
        )} */}
        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("cancel")}
            onClick={() => setShow(false)}
            disabled={loading}
          />
          <Button
            variant="primary"
            label={isEdit ? t("edit") : t("create")}
            onClick={formik.handleSubmit}
            disabled={loading}
            loading={loading}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
