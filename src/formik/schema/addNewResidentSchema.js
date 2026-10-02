import { yupLanguageTranslatedObject } from "@/i18n/routing";
import * as Yup from "yup";

export const addNewResidentSchema = (t) =>
  Yup.object().shape({
    fullName: Yup.object().shape(
      yupLanguageTranslatedObject(t("inputRequired.fullName"))
    ),
    callingCode: Yup.string().required(t("callingCodeRequired")),
    email: Yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    dob: Yup.string()
      .required(t("dobRequired"))
      .test("age-at-least-18", t("ageAtLeast18"), (dob) => {
        const today = new Date();
        const birthDate = new Date(dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18;
      }),
    dateOfArrival: Yup.string().required(t("dateOfArrivalRequired")),
    noOfBeds: Yup.object().required(t("noOfBedsRequired")),

    phoneNumber: Yup.string()
      .required(t("phoneNumberRequired"))
      .matches(/^\+\d+/, t("invalidPhoneNumber")),
    roomNumber: Yup.object().required(t("roomNumberRequired")),
    residentStatus: Yup.object().required(t("statusRequired")),
    gender: Yup.object().required(t("genderRequired")),
    familyMembers: Yup.array().of(
      Yup.object().shape({
        fullName: Yup.object().shape(
          yupLanguageTranslatedObject(t("inputRequired.fullName"))
        ),
        relationship: Yup.object().required(t("relationshipRequired")),
        trcNumber: Yup.string().optional(),
        dob: Yup.string().required(t("dobRequired")),
        gender: Yup.object().required(t("genderRequired")),
        schoolPlacement: Yup.object().when("relationship", {
          is: (relationship) => relationship?.value === "children",
          then: (schema) => schema.required(t("schoolPlacementRequired")),
          otherwise: (schema) => schema.notRequired(),
        }),
        schoolName: Yup.object().when(["relationship", "schoolPlacement"], {
          is: (relationship, schoolPlacement) => {
            return (
              relationship?.value === "children" &&
              schoolPlacement?.value === "placed"
            );
          },
          then: (schema) =>
            schema.shape(
              yupLanguageTranslatedObject(t("inputRequired.schoolName"))
            ),
          otherwise: (schema) => schema.notRequired(),
        }),
        year: Yup.number()
          .max(new Date().getFullYear(), t("yearMax"))
          .when(["relationship", "schoolPlacement"], {
            is: (relationship, schoolPlacement) => {
              return (
                relationship?.value === "children" &&
                schoolPlacement?.value === "placed"
              );
            },
            then: (schema) => schema.required(t("yearRequired")),
            otherwise: (schema) => schema.notRequired(),
          }),
        transportType: Yup.object().when(["relationship", "schoolPlacement"], {
          is: (relationship, schoolPlacement) => {
            return (
              relationship?.value === "children" &&
              schoolPlacement?.value === "placed"
            );
          },
          then: (schema) => schema.required(t("transportTypeRequired")),
          otherwise: (schema) => schema.notRequired(),
        }),
        books: Yup.array().when(["relationship", "schoolPlacement"], {
          is: (relationship, schoolPlacement) => {
            return (
              relationship?.value === "children" &&
              schoolPlacement?.value === "placed"
            );
          },
          then: (schema) =>
            schema
              .of(Yup.string())
              .test("at-least-one-book", t("booksMinRequired"), (books) => {
                if (!books || books.length === 0) return false;
                return books.some((book) => book && book.trim() !== "");
              }),
          otherwise: (schema) => schema.notRequired(),
        }),
      })
    ),
    trcNumber: Yup.string().optional(),
    ppsnNumber: Yup.string().optional(),
    medicalCardNumber: Yup.string().optional(),
  });
