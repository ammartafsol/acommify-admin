"se client";
import React, { useEffect, useState } from "react";
import classes from "./EditMaintenanceRequests.module.css";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import { useTranslations } from "@/resources/hooks/useTranslations";
import DropDown from "@/components/molecules/DropDown/DropDown";
import Input from "@/components/atoms/Input/Input";
import Button from "@/components/atoms/Button";
import { useFormik } from "formik";
import { editMaintenanceRequestSchema } from "@/formik/schema/editMaintenanceRequestSchema";
import {
  formatDateTimeForInput,
  isAdminOrBusinessOwner,
} from "@/resources/utils/helper";
import useAxios from "@/interceptor/axios-functions";
import RenderToast from "@/components/atoms/RenderToast";
import { useSelector } from "react-redux";
import { TextArea } from "@/components/atoms/TextArea/TextArea";

export default function EditMaintenanceRequests({
  show,
  setShow,
  title,
  data,
  onSave = () => {},
}) {
  const t = useTranslations("maintenanceRequestsPage");
  const { user } = useSelector((state) => state.authReducer);
  const [loading, setLoading] = useState("");
  const [allStaff, setAllStaff] = useState([]);
  const { Patch, Get } = useAxios();
  const formattedDateTime = formatDateTimeForInput(data?.requestDateTime);

  const isAssignedToCurrentUser = data?.assignedTo?.userId === user?.userId;

  const isEdit = Boolean(data);
  const formik = useFormik({
    initialValues: {
      residentName: data?.residentName ?? "",
      roomNumber: data?.roomNumber ?? "",
      dateTime: formattedDateTime ?? "",
      issueCategory: data?.issueCategory ?? "",
      description: data?.shortDescription ?? "",
      status: data?.status ? { label: data.status, value: data.status } : null,
      assignToStaff: data?.assignedTo
        ? {
            label: data?.assignedTo?.fullName?.en || "",
            value: data?.assignedTo?.slug,
          }
        : null,
      comment: data?.comment || "",
    },
    enableReinitialize: true,
    validationSchema: editMaintenanceRequestSchema(t),
    onSubmit: (values) =>
      isAdminOrBusinessOwner(user?.role) && !data?.assignedTo
        ? taskAssigningHandler(values)
        : updateMaintenanceRequestHandler(values),
  });
  const getAllStaff = async () => {
    setLoading("gettingStaff");
    const query = { purpose: "maintenance-request", status: "active" };
    const params = new URLSearchParams(query).toString();
    const { response } = await Get({
      route: `admin/staff/assign?${params}`,
    });
    if (response) {
      const options = response?.data?.map((staff) => ({
        label: staff?.fullName?.en || "",
        value: staff?.slug,
      }));
      setAllStaff(options);
    }
    setLoading("");
  };

  const taskAssigningHandler = async (values) => {
    setLoading("assigning");
    const payload = {
      staffSlug: values?.assignToStaff?.value,
      status: "in-progress",
      ...(values?.comment && { comment: values?.comment }),
    };

    const { response } = await Patch({
      route: `admin/maintenance-request/approve/reject/${data?.slug}`,
      data: payload,
    });

    if (response) {
      RenderToast({ type: "success", message: t("taskAssignedSuccessfully") });
      setShow(false);
      formik.resetForm();
      onSave();
    }
    setLoading("");
  };

  const updateMaintenanceRequestHandler = async (values) => {
    setLoading("updating");
    const payload = {
      status: values?.status?.value,
      comment: values?.comment,
    };
    const { response } = await Patch({
      route: `admin/maintenance-request/update/${data?.slug}`,
      data: payload,
    });
    if (response) {
      RenderToast({
        type: "success",
        message: t("maintenanceRequestUpdatedSuccessfully"),
      });
      setShow(false);
      formik.resetForm();
      onSave();
    }
    setLoading("");
  };

  useEffect(() => {
    getAllStaff();
  }, []);

  const getModalHeader = () => {
    if (isAdminOrBusinessOwner(user?.role) && !data?.assignedTo) {
      return title;
    }
    return t("editMaintenanceRequestTitle");
  };

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      maxWidth="698px"
      padding="20px 32px"
      header={getModalHeader()}
    >
      <div className={classes.main}>
        <Input
          label={t("inputsLabels.residentName")}
          placeholder={t("inputsPlaceholders.residentName")}
          value={formik.values.residentName}
          setValue={(val) => formik.setFieldValue("residentName", val)}
          errorText={formik.touched.residentName && formik.errors.residentName}
          disabled={isEdit}
        />
        <Input
          label={t("inputsLabels.roomNumber")}
          placeholder={t("inputsPlaceholders.roomNumber")}
          value={formik.values.roomNumber}
          setValue={(val) => formik.setFieldValue("roomNumber", val)}
          errorText={formik.touched.roomNumber && formik.errors.roomNumber}
          disabled={isEdit}
        />
        <Input
          label={t("inputsLabels.requestDateTime")}
          placeholder={t("inputsPlaceholders.requestDateTime")}
          type="datetime-local"
          inputContainerClass={classes.inputDateContainer}
          value={formik.values.dateTime}
          setValue={(val) => formik.setFieldValue("dateTime", val)}
          errorText={formik.touched.dateTime && formik.errors.dateTime}
          disabled={isEdit}
        />
        <Input
          label={t("inputsLabels.issueCategory")}
          placeholder={t("inputsPlaceholders.issueCategory")}
          value={formik.values.issueCategory}
          setValue={(val) => formik.setFieldValue("issueCategory", val)}
          errorText={
            formik.touched.issueCategory && formik.errors.issueCategory
          }
          disabled={isEdit}
        />
        <Input
          label={t("inputsLabels.description")}
          placeholder={t("inputsPlaceholders.description")}
          value={formik.values.description}
          setValue={(val) => formik.setFieldValue("description", val)}
          errorText={formik.touched.description && formik.errors.description}
          disabled={isEdit}
        />

        {data?.status !== "completed" && isAdminOrBusinessOwner(user?.role) && (
          <DropDown
            isPortal
            label={t("inputsLabels.assignToStaff")}
            dropDownContainerClass={classes.dropdownClass}
            placeholder={t("inputsPlaceholders.assignToStaff")}
            options={allStaff}
            value={formik.values.assignToStaff}
            setValue={(val) => formik.setFieldValue("assignToStaff", val)}
            error={formik.touched.assignToStaff && formik.errors.assignToStaff}
            disabled={loading === "gettingStaff"}
          />
        )}
        {((data?.assignedTo && isAdminOrBusinessOwner(user?.role)) ||
          user?.role === "staff") && (
          <DropDown
            isPortal
            label={t("inputsLabels.status")}
            dropDownContainerClass={classes.dropdownClass}
            placeholder={t("inputsPlaceholders.status")}
            options={[
              { label: "In Progress", value: "in-progress" },
              { label: "Completed", value: "completed" },
              { label: "Escalated", value: "escalated" },
            ]}
            value={formik.values.status}
            setValue={(val) => formik.setFieldValue("status", val)}
          />
        )}

        {/* now do for comment and edit comment */}
        {(isAssignedToCurrentUser || isAdminOrBusinessOwner(user?.role)) && (
          <TextArea
            label={"Comment"}
            placeholder={"Add your comment here"}
            value={formik.values.comment}
            setter={(val) => formik.setFieldValue("comment", val)}
          />
        )}

        <div className={classes.btns}>
          <Button
            label={t("buttons.cancel")}
            variant={"outlined"}
            onClick={() => setShow(false)}
          />
          <Button
            label={t("buttons.submit")}
            variant={"primary"}
            onClick={formik.handleSubmit}
            disabled={loading === "assigning" || loading === "updating"}
            loading={loading === "assigning" || loading === "updating"}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
