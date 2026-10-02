"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import { LoginSchema } from "@/formik/schema/loginSchema";
import { Link, useRouter } from "@/i18n/navigation";
import { localeOptions } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import { handleEncrypt } from "@/interceptor/encryption";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { saveLoginUserData } from "@/store/auth/authSlice";
import { useFormik } from "formik";
import Cookies from "js-cookie";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Container } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";

export default function Login({ type = "admin" }) {
  const t = useTranslations("loginPage");
  const c = useTranslations("toast");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const { Post } = useAxios();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: LoginSchema(t),
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });
  const handleSubmit = async (values) => {
    setLoading("loading");
    const { response } = await Post({
      route:
        type === "admin"
          ? "auth/admin/login"
          : type === "nationwide-dashboard"
            ? "auth/nation-wide/login"
            : "auth/business-owner/login",
      data: values,
    });
    if (response) {
      const data = response?.data;
      dispatch(saveLoginUserData(data));
      Cookies.set("_xpdx_acom", handleEncrypt(response?.data?.token), {
        expires: 7,
      });
      Cookies.set(
        "_xpdx_rf_acom",
        handleEncrypt(response?.data?.refreshToken),
        {
          expires: 90,
        },
      );
      Cookies.set("role", response?.data?.user?.role, {
        expires: 7,
      });
      // Store user permissions for middleware access
      Cookies.set(
        "user_permissions",
        JSON.stringify(response?.data?.user?.permissions || []),
        {
          expires: 7,
        },
      );
      RenderToast({ type: "success", message: c("loginSuccess") });
      router.replace("/dashboard");
    }
    setLoading("");
  };

  const isRtl = localeOptions.find((l) => l.value === locale)?.isRtl || false;
  const inputDir = isRtl ? "rtl" : "ltr";

  const titleByType = {
    admin: "titleAdmin",
    "nationwide-dashboard": "titleNationwide",
    "business-owner": "titleCentre",
  };
  const titleKey = titleByType[type] || "titleCentre";

  const otherLogins = [
    {
      type: "business-owner",
      href: "/login",
      labelKey: "gotoBusinessOwnerLogin",
    },
    {
      type: "nationwide-dashboard",
      href: "/login/nationwide-dashboard",
      labelKey: "gotoNationWideLogin",
    },
    {
      type: "admin",
      href: "/login/admin",
      labelKey: "gotoAdminLogin",
    },
  ].filter((login) => login.type !== type);

  return (
    <Container className={mergeClass("containerFluid", styles.wrapper)}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <ReactSVG src="/svg/login.svg" className="reactSvg" />
          </div>
          <h1>{t(titleKey)}</h1>
        </div>
        <div className={styles.inputGroup}>
          <Input
            dir={inputDir}
            label={t("emailLabel")}
            placeholder={t("emailPlaceholder")}
            type="email"
            value={formik.values.email}
            setValue={formik.handleChange("email")}
            errorText={formik.touched.email && formik.errors.email}
            disabled={loading}
            onEnterClick={formik.handleSubmit}
          />
        </div>

        <div className={styles.inputGroup}>
          <Input
            dir={inputDir}
            label={t("passwordLabel")}
            placeholder={t("passwordPlaceholder")}
            type={"password"}
            value={formik.values.password}
            setValue={formik.handleChange("password")}
            errorText={formik.touched.password && formik.errors.password}
            disabled={loading}
            onEnterClick={formik.handleSubmit}
          />
          <div className={styles.forgotPassword}>
            <Link href="/forgot-password">{t("forgotPass")}</Link>
          </div>
        </div>

        <Button
          className={styles.loginButton}
          onClick={formik.handleSubmit}
          type="submit"
          variant="primary"
          label={t("loginButton")}
          loading={loading}
          showSpinner={loading}
          disabled={loading}
        />
        <div className={styles.registerLink}>
          {otherLogins.map((login) => (
            <Link key={login.href} className={styles.link} href={login.href}>
              {t(login.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}
