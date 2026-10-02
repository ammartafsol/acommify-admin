import * as Yup from "yup";

export const updatePasswordSchema = (t) =>
  Yup.object().shape({
    password: Yup.string()
      .required(t("passwordRequired"))
      .min(8, t("minPasswordError"))
      .max(20, t("maxPasswordError"))
      .matches(/[a-z]/, t("lowerPasswordError"))
      .matches(/[A-Z]/, t("upperPasswordError"))
      .matches(/[!@#$%^&*(),.?":{}|<>]/, t("specialPasswordError")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], t("ConfirmPasswordError"))
      .required(t("confirmPasswordRequired")),
  });
