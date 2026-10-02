"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import { ForgotPasswordSchema } from "@/formik/schema/forgotPasswordSchema";
import { useRouter } from "@/i18n/navigation";
import useAxios from "@/interceptor/axios-functions";
import { handleEncrypt } from "@/interceptor/encryption";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useFormik } from "formik";
import Cookies from "js-cookie";
import { useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import styles from "./styles.module.css";

export default function ForgotPassword() {
  const t = useTranslations("forgotPasswordPage");
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const c = useTranslations("toast");
  const { Post } = useAxios();
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: ForgotPasswordSchema(t),
    onSubmit: (values) => {
      console.log(values);
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values) => {
    setLoading("sendingOtp");
    const { response } = await Post({
      route: `auth/admin/forgot/password`,
      data: values,
    });
    if (response) {
      RenderToast({
        type: "success",
        message: c("verifyOtpSend"),
      });
      router.replace("/verify-otp");
    }
    setLoading("");
    Cookies.set("email", handleEncrypt(values?.email));
  };

  return (
    <Container className={mergeClass("containerFluid", styles.wrapper)}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <form className={styles.form} onSubmit={formik.handleSubmit}>
          <div className={styles.inputGroup}>
            <Input
              label={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              type="email"
              value={formik.values.email}
              setValue={formik.handleChange("email")}
              errorText={formik.touched.email && formik.errors.email}
              disabled={loading}
            />
          </div>

          <Button
            className={styles.submitBtn}
            disabled={loading === "sendingOtp"}
            onClick={formik.handleSubmit}
            type="submit"
            variant="primary"
            label={
              <>
                {t("submitButton")}
                {loading === "sendingOtp" && (
                  <Spinner className={styles?.spinner} size="sm" />
                )}
              </>
            }
          />
        </form>
      </div>
    </Container>
  );
}
