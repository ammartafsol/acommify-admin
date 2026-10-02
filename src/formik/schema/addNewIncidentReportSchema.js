import { yupLanguageTranslatedObject } from "@/i18n/routing";
import { isAdminOrBusinessOwner } from "@/resources/utils/helper";
import * as Yup from "yup";

export const addNewIncidentReportSchema = (t, userRole) =>
  Yup.object().shape({
    title: Yup.object().shape(
      yupLanguageTranslatedObject(t("inputRequired.title"))
    ),
    description: Yup.object().shape(
      yupLanguageTranslatedObject(t("inputRequired.description"))
    ),
    location: Yup.object().shape(
      yupLanguageTranslatedObject(t("inputRequired.location"))
    ),
    residentInvolved: Yup.object().required(
      t("inputRequired.residentInvolved")
    ),
    staff: isAdminOrBusinessOwner(userRole)
      ? Yup.object().required(t("inputRequired.reportedBy"))
      : Yup.object().nullable().notRequired(),
    severity: Yup.object().required(t("inputRequired.severity")),
    status: Yup.object().required(t("inputRequired.status")),
    completedDate: Yup.date().when("status", ([status], schema) => {
      return status?.value === "resolved"
        ? schema.required(t("inputRequired.completedDate"))
        : schema.notRequired();
    }),
  });
