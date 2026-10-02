import { yupLanguageObject } from "@/i18n";
import { yupLanguageTranslatedObject } from "@/i18n/routing";
import * as Yup from "yup";

export const addNewStaffSchema = (t) => {
  return Yup.object().shape({
    fullName: Yup.object().shape(
      yupLanguageTranslatedObject(t("formikSchema.fullNameRequired"))
    ),
    email: Yup.string()
      .email(t("formikSchema.emailAddress"))
      .required(t("formikSchema.emailRequired")),
    callingCode: Yup.string().required(t("formikSchema.callingRequired")),
    phoneNumber: Yup.string()
      .matches(/^\+?[0-9]{10,15}$/, t("formikSchema.phoneNumberLimit"))
      .required(t("formikSchema.phoneNumberRequired")),

    shiftStart: Yup.string().required(t("formikSchema.shiftStartRequired")),
    shiftEnd: Yup.string().required(t("formikSchema.shiftEndRequired")),
    positionSlug: Yup.object().required(t("formikSchema.positionRequired")),
    permissions: Yup.array()
      .of(Yup.string())
      .required(t("formikSchema.permissionsRequired")),
  });
};
