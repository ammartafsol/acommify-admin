import { emailRegex, phoneRegex } from "@/resources/utils/regex";
import * as Yup from "yup";

export const SignUpSchema = (t) =>
  Yup.object().shape({
    name: Yup.string().required(t("nameRequired")),
    email: Yup.string()
      .email(t("emailError"))
      .required(t("emailRequired"))
      .test(
        "no-special-chars",
        t("emailInvalidChars"),
        (value) => !value || emailRegex.test(value)
      ),
    code: Yup.string().required(t("codeRequired")),
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
