import { yupLanguageTranslatedObject } from "@/i18n/routing";
import * as Yup from "yup";

export const configurationSchema = (t) =>
  Yup.object().shape({
    name: Yup.object().shape(yupLanguageTranslatedObject(t("modal.nameRequired"))),
    ipAddress: Yup.string()
      .required(t("modal.ipAddressRequired"))
      .matches(
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        t("modal.ipAddressInvalid")
      ),
  });
