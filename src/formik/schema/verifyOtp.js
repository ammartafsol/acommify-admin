import * as Yup from "yup";

export const VerifyOtpSchema = (t) => {
  return Yup.object({
    code: Yup.string().min(4, t("minLimit")).required(t("otpRequired")),
  });
};
