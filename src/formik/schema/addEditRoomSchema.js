import * as yup from "yup";

export const addEditRoomSchema = (t) =>
  yup.object({
    accommodationNumber: yup
      .string()
      .required(t("modalFormik.HouseRoomNumberRequired"))
      .min(2, t("modalFormik.2Characters")),
    noOfBeds: yup.number().when("userType", {
      is: (userType) => userType?.value !== "visitor",
      then: (schema) =>
        schema
          .required(t("modalFormik.BedsRequired"))
          .min(1, t("modalFormik.atLeastBeds"))
          .max(10, t("modalFormik.ExceedBeds")),
      otherwise: (schema) =>
        schema
          .min(0, t("modalFormik.atLeastBeds"))
          .max(10, t("modalFormik.ExceedBeds")),
    }),
    type: yup.object().nullable().required(t("modalFormik.TypeRequired")),
    userType: yup
      .object()
      .nullable()
      .required(t("modalFormik.UserTypeRequired")),
  });
