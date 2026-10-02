import { emailRegex } from "@/resources/utils/regex";
import * as Yup from "yup";

export const LoginSchema = (t) => {
  return Yup.object({
    email: Yup.string()
      .email(t("emailError"))
      .required(t("EmailRequired"))
      .test(
        "no-special-chars",
        t("emailInvalidChars"),
        (value) => !value || emailRegex.test(value)
      ),
    password: Yup.string().required(t("passwordRequired")),
  });
};
