import { yupLanguageObject } from "@/i18n";
import * as yup from "yup";

export const AddDocumentSchema = (t) =>
  yup.object().shape({
    name: yup.object().shape(yupLanguageObject(t("modal.nameRequired"))),
    documentType: yup.object().required(t("modal.documentTypeRequired")),
    document: yup
      .mixed()
      .nullable()
      .test("document-required", t("modal.documentRequired"), function (value) {
        const { isEdit } = this.options.context || {};
        if (!isEdit && !value) {
          return false;
        }
        return true;
      })
      .required(t("modal.documentRequired")),
  });
