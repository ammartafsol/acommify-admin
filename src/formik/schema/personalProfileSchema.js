import * as Yup from "yup";

export const personalProfileSchema = (t) =>
  Yup.object({
    photo: Yup.string().required(t("form.errors.required", { field: "Photo" })),
    generalInformation: Yup.object({
      fullName: Yup.string().required(
        t("form.errors.required", { field: "Full Name" })
      ),
      residentIdNumber: Yup.string().required(
        t("form.errors.required", { field: "Resident ID Number" })
      ),
      houseNumber: Yup.string().required(
        t("form.errors.required", { field: "House Number" })
      ),
      phoneNumber: Yup.string().required(
        t("form.errors.required", { field: "Phone Number" })
      ),
      email: Yup.string()
        .email(t("form.errors.invalidEmail"))
        .required(t("form.errors.required", { field: "Email Address" })),
    }),
    additionalInformation: Yup.object({
      carRegistration: Yup.string().required(
        t("form.errors.required", { field: "Car Registration" })
      ),
      emergencyContact: Yup.string().required(
        t("form.errors.required", { field: "Emergency Contact" })
      ),
      fullName: Yup.string().required(
        t("form.errors.required", { field: "Full Name" })
      ),
      document: Yup.array()
        .of(
          Yup.string().required(
            t("form.errors.required", { field: "Document" })
          )
        )
        .min(1, t("form.errors.required", { field: "At least one document" })),
    }),
    familyMembers: Yup.array()
      .of(
        Yup.object({
          fullName: Yup.string().required(
            t("form.errors.required", { field: "Family Member Full Name" })
          ),
          relationship: Yup.string().required(
            t("form.errors.required", { field: "Relationship" })
          ),
          age: Yup.number()
            .typeError(t("form.errors.invalid", { field: "Age" }))
            .positive(t("form.errors.invalid", { field: "Age" }))
            .integer(t("form.errors.invalid", { field: "Age" }))
            .nullable(),
        })
      )
      .min(
        1,
        t("form.errors.required", { field: "At least one family member" })
      ),
  });
