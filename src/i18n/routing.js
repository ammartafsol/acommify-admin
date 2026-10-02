import * as yup from "yup";

export const locales = [
  "en",
  "pt",
  "es",
  "fr",
  "ka",
  "ha",
  "ar",
  "uk",
  "ps",
  // "ur",
];
export const defaultLocale = "en";
export const localeOptions = [
  {
    value: "en",
    label: "English (UK)",
    imageUrl: "/svg/flags/ukFlag.svg",
    isRtl: false,
  },
  {
    value: "pt",
    label: "Brazilian Portuguese",
    imageUrl: "/svg/flags/brazilFlag.svg",
    isRtl: false,
  },
  {
    value: "es",
    label: "Spanish",
    imageUrl: "/svg/flags/spainFlag.svg",
    isRtl: false,
  },
  {
    value: "fr",
    label: "French",
    imageUrl: "/svg/flags/franceFlag.svg",
    isRtl: false,
  },
  {
    value: "ka",
    label: "Georgian",
    imageUrl: "/svg/flags/georgiaFlag.svg",
    isRtl: false,
  },
  {
    value: "ha",
    label: "Hausa (Nigeria)",
    imageUrl: "/svg/flags/nigeriaFlag.svg",
    isRtl: false,
  },
  {
    value: "ar",
    label: "Arabic",
    imageUrl: "/svg/flags/saudiaArabiaFlag.svg",
    isRtl: true,
  },
  {
    value: "uk",
    label: "Ukrainian",
    imageUrl: "/svg/flags/ukraineFlag.svg",
    isRtl: false,
  },
  {
    value: "ps",
    label: "Pashto",
    imageUrl: "/svg/flags/afghanistanFlag.svg",
    isRtl: true,
  },
];

export const languageObject = locales.reduce((obj, locale) => {
  obj[locale] = "";
  return obj;
}, {});

export const yupTouchedObject = localeOptions.reduce((obj, locale) => {
  obj[locale.value] = true;
  return obj;
}, {});

export const yupLanguageObject = (fieldName) =>
  localeOptions.reduce((obj, locale) => {
    obj[locale.value] = yup
      .string()
      .required(`${fieldName} in ${locale.label} is required`);
    return obj;
  }, {});

export const yupLanguageTranslatedObject = (translation) =>
  localeOptions.reduce((obj, locale) => {
    obj[locale.value] = yup.string().required(translation);
    return obj;
  }, {});

export const yupLanguageObjectOptional = (fieldName) =>
  localeOptions.reduce((obj, locale) => {
    obj[locale.value] = yup.string().optional();
    return obj;
  }, {});

export const routing = {
  locales,
  defaultLocale,
  localePrefix: "always",
  localeOptions,
};
