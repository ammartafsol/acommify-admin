import { yupLanguageObject } from "@/i18n";
import * as Yup from "yup";

export const positionSchema = Yup.object().shape({
  name: Yup.object().shape(yupLanguageObject("name")),
  status: Yup.string().nullable(),
});
