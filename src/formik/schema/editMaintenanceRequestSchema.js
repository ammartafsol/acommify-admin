import * as yup from "yup";

const optionSchema = yup.object({
  label: yup.string().required(),
  value: yup.string().required(),
});

export const editMaintenanceRequestSchema = (t) =>
  yup.object({
    residentName: yup.string().required(t("validation.residentNameRequired")),
    roomNumber: yup.string().required(t("validation.roomNumberRequired")),
    dateTime: yup
      .date()
      .typeError(t("validation.requestDateTimeRequired"))
      .required(t("validation.requestDateTimeRequired")),
    issueCategory: yup.string().required(t("validation.issueCategoryRequired")),
    description: yup.string().required(t("validation.descriptionRequired")),
    status: optionSchema.required(t("validation.statusRequired")),
    assignToStaff: yup.mixed().when("status", (schema, status) => {
      const isPending = status?.value === "pending";
      return isPending
        ? optionSchema.required(t("validation.assignToStaffRequired"))
        : yup.mixed().nullable();
    }),
  });
