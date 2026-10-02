import { yupLanguageObject } from "@/i18n";
import * as Yup from "yup";

export const cmsSchema = Yup.object().shape({
  title: Yup.string().required(yupLanguageObject("Title is Required")),

  description: Yup.string().required(
    yupLanguageObject("Description is Required")
  ),

  media: Yup.array()
    .min(1, "Media files are required")
    .max(3, "You can upload up to 3 files only")
    .required("Media files are required"),
});
