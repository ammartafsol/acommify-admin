"use client";
import Button from "@/components/atoms/Button";
import RenderToast from "@/components/atoms/RenderToast";
import { VerifyOtpSchema } from "@/formik/schema/verifyOtp";
import { useRouter } from "@/i18n/navigation";
import useAxios from "@/interceptor/axios-functions";
import { handleDecrypt, handleEncrypt } from "@/interceptor/encryption";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useFormik } from "formik";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import OTPInput from "react-otp-input";
import styles from "./styles.module.css";

export default function VerifyOTP() {
  const t = useTranslations("verificationPage");
  const c = useTranslations("toast");
  const router = useRouter();
  const { Post } = useAxios();
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState("");
  const [canResend, setCanResend] = useState(false);
  const email = handleDecrypt(Cookies.get("email"));
  const expiryDate = new Date(Date.now() + 10 * 60 * 1000);

  const formik = useFormik({
    initialValues: { code: "" },
    validationSchema: VerifyOtpSchema(t),
    onSubmit: handleVerifyOTP,
  });

  async function handleVerifyOTP({ code }) {
    setLoading("verify");

    const { response } = await Post({
      route: "auth/verify/otp",
      data: {
        email,
        code: code,
      },
    });

    if (response) {
      Cookies.set("code", handleEncrypt(code), { expires: expiryDate });
      RenderToast({ message: c("verifyOtp"), type: "success" });
      router.replace("/reset-password");
    }

    setLoading("");
  }

  async function handleResendOTP() {
    if (!canResend) return;

    setLoading("resend");

    const { response } = await Post({
      route: "auth/resend/otp",
      data: { email },
    });

    if (response) {
      RenderToast({
        type: "success",
        message: c("resentOtp"),
      });
      setTimer(60);
      setCanResend(false);
    }
    setLoading("");
  }

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);
  return (
    <Container className={mergeClass("containerFluid", styles.wrapper)}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>

        <div className={styles.otpContainer}>
          <OTPInput
            value={formik.values.code}
            onChange={formik.handleChange("code")}
            numInputs={4}
            separator={<span className={styles.separator}></span>}
            inputStyle={styles.otpInput}
            containerStyle={styles.otpWrapper}
            renderInput={(props) => <input {...props} />}
            shouldAutoFocus
            disabled={loading}
          />
          {formik.touched.code && formik.errors.code && (
            <p className={styles.error}>*{formik.errors.code}</p>
          )}
        </div>

        <div className={styles.resendSection}>
          <Button
            disabled={!canResend || loading === "resend"}
            className={styles.codeButton}
            onClick={canResend ? handleResendOTP : undefined}
            label={
              loading === "resend"
                ? t("sendingOtp", { time: timer })
                : t("resendCode", { time: timer })
            }
          />
        </div>

        <Button
          className={styles.submitBtn}
          onClick={formik.handleSubmit}
          type="submit"
          variant="primary"
          label={t("verifyButton")}
          disabled={loading === "verify"}
          loading={loading}
          showSpinner={loading}
        />
      </div>
    </Container>
  );
}
