import React, { useState } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import { useFormik } from "formik";
import * as Yup from "yup";
import classes from "./AddCommentModal.module.css";
import Button from "@/components/atoms/Button";
import { useTranslations } from "@/resources/hooks/useTranslations";
import useAxios from "@/interceptor/axios-functions";
import RenderToast from "@/components/atoms/RenderToast";

export default function AddCommentModal({ show, setShow, data, onSave }) {
  const t = useTranslations("maintenanceRequestsPage.commentModal");
  const [loading, setLoading] = useState(false);
  const { Patch } = useAxios();
  console.log(data);
  const formik = useFormik({
    initialValues: {
      comment: data?.comment || "",
    },
    validationSchema: Yup.object().shape({
      comment: Yup.string().required(t("commentRequired")),
    }),
    onSubmit: (values) => {
      addCommentHandler(values);
    },
  });

  const addCommentHandler = async (values) => {
    setLoading(true);
    const { response } = await Patch({
      route: `admin/maintenance-request/update/${data?.slug}`,
      data: {
        comment: values.comment,
      },
    });
    if (response) {
      RenderToast({
        type: "success",
        message: data?.comment
          ? t("commentUpdatedSuccessfully")
          : t("commentAddedSuccessfully"),
      });
      onSave();
      setShow(false);
      formik.resetForm();
    }
    setLoading(false);
  };

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      header={data?.comment ? t("editComment") : t("addComment")}
      headerClass={classes.header}
      size="sm"
      maxWidth="500px"
    >
      <div className={classes.main}>
        <TextArea
          // label={t("comment")}
          placeholder={t("commentPlaceholder")}
          value={formik.values.comment}
          setter={(value) => {
            formik.setFieldValue("comment", value);
          }}
          disabled={loading}
          errorText={formik.touched.comment && formik.errors.comment}
        />
        <div className={classes.buttons}>
          <Button
            label={t("cancel")}
            onClick={() => setShow(false)}
            variant={"outlined"}
            disabled={loading}
          />
          <Button
            label={data?.comment ? t("update") : t("submit")}
            onClick={formik.handleSubmit}
            disabled={loading}
            loading={loading}
            showSpinner
            variant="primary"
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
