import { emailRegex } from "@/resources/utils/helper";
import * as Yup from "yup";

export const ForgotPasswordSchema = (t) => {
  return Yup.object({
    email: Yup.string()
      .email(t("emailError"))
      .required(t("emailRequired"))

      .test(
        t("specialChar"),
        t("emailInvalidChars"),
        (value) => !value || emailRegex.test(value)
      ),
  });
};
