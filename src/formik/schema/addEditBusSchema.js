import { yupLanguageObject } from "@/i18n";
import { yupLanguageTranslatedObject } from "@/i18n/routing";
import * as yup from "yup";

const addEditBusSchema = (t) =>
  yup.object().shape({
    busName: yup.object().shape(yupLanguageTranslatedObject(t("modal.validation.busName"))),
    description: yup.object().shape(yupLanguageTranslatedObject(t("modal.validation.description"))),
    busNumber: yup.string().required(t("modal.validation.busNumber")),
    startLocation: yup.object().shape(yupLanguageTranslatedObject(t("modal.validation.startLocation"))),
    endLocation: yup.object().shape(yupLanguageTranslatedObject(t("modal.validation.endLocation"))),
    capacity: yup.object().required(t("modal.validation.capacity")),
    shift: yup.object().notRequired(),
    availableDates: yup
      .array()
      .min(1, t("modal.validation.availableDates"))
      .required(t("modal.validation.availableDates")),
    startTime: yup.string().required(t("modal.validation.startTime")),
    endTime: yup
      .string()
      .required(t("modal.validation.endTime"))
      .test("after-start", t("modal.validation.endTimeAfterStart"), function (value) {
        const { startTime } = this.parent;
        if (!value || !startTime) return true;
        return value > startTime;
      }),
    document: yup.mixed().required(t("modal.validation.mediaError")),
  });

export default addEditBusSchema;
