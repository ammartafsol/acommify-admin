"use client";
import React from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./styles.module.css";
import Input from "@/components/atoms/Input/Input";
import Button from "@/components/atoms/Button";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function EditBusBookingModal({
  show,
  setShow,
  data,
  setData,
  t,
}) {
  const formik = useFormik({
    initialValues: {
      name: data?.residentName || "",
      seatNumber: data?.seatNumber || "",
      houseNumber: data?.houseNumber || "",
      specialRequests: data?.specialRequests || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required(t("modal.validations.residentName")),
      seatNumber: Yup.string().required(
        t("modal.validations.invalidSeatNumber")
      ),
      houseNumber: Yup.string().required(
        t("modal.validations.invalidHouseNumber")
      ),
      specialRequests: Yup.string(),
    }),
    onSubmit: (values) => {
      console.log("Submitted values:", values);
      //   setShow(false);
    },
  });

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      width="600px"
      padding="30px"
      borderRadius="24px"
      header="Edit Bus Booking"
    >
      <form onSubmit={formik.handleSubmit} className={classes.main}>
        <Input
          label={t("table.residentName")}
          value={formik.values.name}
          setValue={(value) => formik.setFieldValue("name", value)}
          name="name"
          errorText={formik.touched.name && formik.errors.name}
        />

        <Input
          label={t("table.seatNumber")}
          value={formik.values.seatNumber}
          setValue={(value) => formik.setFieldValue("seatNumber", value)}
          name="seatNumber"
          errorText={formik.touched.seatNumber && formik.errors.seatNumber}
        />

        <Input
          label={t("table.houseNumber")}
          value={formik.values.houseNumber}
          setValue={(value) => formik.setFieldValue("houseNumber", value)}
          name="houseNumber"
          errorText={formik.touched.houseNumber && formik.errors.houseNumber}
        />

        <Input
          label={t("table.specialRequests")}
          value={formik.values.specialRequests}
          setValue={(value) => formik.setFieldValue("specialRequests", value)}
          name="specialRequests"
          errorText={
            formik.touched.specialRequests && formik.errors.specialRequests
          }
        />

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            label={t("modal.buttons.cancel")}
            onClick={() => {
              setShow(false);
              setData(null);
            }}
          />
          <Button
            type="submit"
            variant="primary"
            label={t("modal.buttons.saveChanges")}
          />
        </div>
      </form>
    </ModalSkeleton>
  );
}
