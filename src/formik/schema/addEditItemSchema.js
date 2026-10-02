import { yupLanguageTranslatedObject } from "@/i18n/routing";
import * as Yup from "yup";

export const addEditItemSchema = (t) =>
  Yup.object().shape({
    itemName: Yup.object().shape(
      yupLanguageTranslatedObject(t("inputRequired.itemName"))
    ),
    stock: Yup.number()
      .positive(t("modal.stockMustBePositive"))
      .integer(t("modal.stockMustBeInteger"))
      .required(t("modal.stockRequired")),
    points: Yup.number()
      .positive(t("modal.pointsMustBePositive"))
      .integer(t("modal.pointsMustBeInteger"))
      .required(t("modal.pointsRequired")),
    image: Yup.mixed().required(t("modal.photoRequired")),
    shippingOptions: Yup.object().required(t("modal.shippingOptionsRequired")),
    category: Yup.object().required(t("modal.categoryRequired")),
  });
