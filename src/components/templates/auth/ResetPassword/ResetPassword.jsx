"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import SuccessModal from "@/components/organisms/Modals/SuccessModal";
import { updatePasswordSchema } from "@/formik/schema/updatePasswordSchema";
import { useRouter } from "@/i18n/navigation";
import { localeOptions } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import { handleDecrypt } from "@/interceptor/encryption";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useFormik } from "formik";
import Cookies from "js-cookie";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import styles from "./styles.module.css";

export default function ResetPassword() {
  const t = useTranslations("resetPasswordPage");
  const c = useTranslations("toast");
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { Post } = useAxios();
  const email = handleDecrypt(Cookies.get("email"));
  const code = handleDecrypt(Cookies.get("code"));
  const [loading, setLoading] = useState("");
  const locale = useLocale();

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: updatePasswordSchema(t),
    onSubmit: (values) => {
      // console.log("Login attempt:", values);
      setShowSuccessModal(true);
      handleSubmit(values);
    },
  });
  const isRtl = localeOptions.find((l) => l.value === locale)?.isRtl || false;
  const inputDir = isRtl ? "rtl" : "ltr";
  const handleSubmit = async (values) => {
    setLoading("loading");

    const payload = {
      email: email,
      password: values?.password,
      confirmPassword: values?.confirmPassword,
      code: code,
    };

    const { response } = await Post({
      route: `auth/reset/password`,
      data: payload,
    });

    if (response) {
      RenderToast({
        type: "success",
        message: c("resetSuccess"),
      });
      Cookies.remove("email");
      Cookies.remove("otp");
      router.replace("/");
    }
    setLoading("");
  };
  useEffect(() => {
    if (!email || !code) {
      RenderToast({
        type: "error",
        message: !email ? c("expiredEmail") : c("expiredCode"),
      });
      router.replace("/");
    }
  }, []);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.wrapper)}>
        <div className={styles.loginBox}>
          <div className={styles.header}>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <form className={styles.form}>
            <div className={styles.inputGroup}>
              <Input
                dir={inputDir}
                label={t("passwordLabel")}
                placeholder={t("passwordPlaceholder")}
                type="password"
                value={formik.values.password}
                setValue={formik.handleChange("password")}
                errorText={formik.touched.password && formik.errors.password}
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <Input
                dir={inputDir}
                label={t("confirmPasswordLabel")}
                placeholder={t("confirmPasswordPlaceholder")}
                type="password"
                value={formik.values.confirmPassword}
                setValue={formik.handleChange("confirmPassword")}
                errorText={
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                }
                disabled={loading}
              />
            </div>

            <Button
              className={styles.submitBtn}
              onClick={formik.handleSubmit}
              type="submit"
              variant="primary"
              label={t("submitButton")}
              disabled={loading}
              loading={loading}
              showSpinner={loading}
            />
          </form>
        </div>
      </Container>
      {
        showSuccessModal && (
          <SuccessModal
            show={showSuccessModal}
            setShow={setShowSuccessModal}
            icon="/svg/approvedSparkles.svg"
            onClickbutton={() => router.push("/dashboard")}
            content="resetPasswordPage.modal"
          />
        )
      }
    </>
  );
}
