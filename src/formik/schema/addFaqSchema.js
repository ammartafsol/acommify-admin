import { yupLanguageObject } from "@/i18n";
import * as Yup from "yup";

export const AddFaqsSchema = Yup.object().shape({
  question: Yup.object().shape(yupLanguageObject("question")),
  answer: Yup.object().shape(yupLanguageObject("answer")),
  status: Yup.string().nullable(),
});
