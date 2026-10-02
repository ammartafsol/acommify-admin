import { yupLanguageTranslatedObject } from "@/i18n/routing";
import * as Yup from "yup";

export const addEditCategorySchema = (t) =>
  Yup.object().shape({
    name: Yup.object().shape(
      yupLanguageTranslatedObject(t("inputRequired.name"))
    ),
  });
