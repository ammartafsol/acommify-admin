"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import QuillInput from "@/components/atoms/QuillInput";
import RenderToast from "@/components/atoms/RenderToast";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import TopHeader from "@/components/molecules/TopHeader/TopHeader";
import UploadMedia from "@/components/organisms/UploadMedia";
import { localeOptions, locales } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import { useTranslations } from "@/resources/hooks/useTranslations";
import {
  createFormData,
  mergeClass,
  translateText,
} from "@/resources/utils/helper";
import axios from "axios";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import * as Yup from "yup";
import classes from "./styles.module.css";

const unwantedFields = [
  "_id",
  "createdAt",
  "updatedAt",
  "__v",
  "slug",
  "status",
  "lastUpdated",
];

const LEGAL_HTML_PAGES = [
  "termsAndConditionsPage",
  "dataProcessingAgreementPage",
  "cookiePolicyPage",
  "accessibilityStatementPage",
];

const LEGAL_PAGE_TITLES = {
  termsAndConditionsPage: "termsAndConditions",
  dataProcessingAgreementPage: "dataProcessingAgreement",
  cookiePolicyPage: "cookiePolicy",
  accessibilityStatementPage: "accessibilityStatement",
};

// Remove unwanted fields from data
const removeUnwantedFields = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(removeUnwantedFields);
  }
  if (obj && typeof obj === "object") {
    const newObj = { ...obj };

    unwantedFields.forEach((field) => delete newObj[field]);
    Object.keys(newObj).forEach((key) => {
      newObj[key] = removeUnwantedFields(newObj[key]);
    });
    return newObj;
  }
  return obj;
};

// const getLanguageValidationSchema = (fieldLabel = "Field") => {
//   const shape = {};
//   localeOptions.forEach((locale) => {
//     shape[locale.value] = Yup.string().required(
//       `${fieldLabel} in ${locale.label} is required`
//     );
//   });
//   return Yup.object().shape(shape);
// };

const buildInitialValues = (data) => {
  const initial = {};
  localeOptions.forEach((locale) => {
    const lang = locale.value;
    if (data?.laundryService) {
      initial.laundryService = initial.laundryService || {
        title: {},
        description: {},
        video: "",
      };
      initial.laundryService.title[lang] =
        data.laundryService.title?.[lang] || "";
      initial.laundryService.description[lang] =
        data.laundryService.description?.[lang] || "";
      initial.laundryService.video = data.laundryService.video || "";
    }
    if (data?.maintenanceRequest) {
      initial.maintenanceRequest = initial.maintenanceRequest || {
        title: {},
        description: {},
        video: "",
      };
      initial.maintenanceRequest.title[lang] =
        data.maintenanceRequest.title?.[lang] || "";
      initial.maintenanceRequest.description[lang] =
        data.maintenanceRequest.description?.[lang] || "";
      initial.maintenanceRequest.video = data.maintenanceRequest.video || "";
    }
    if (data?.transportInformation) {
      initial.transportInformation = initial.transportInformation || {
        title: {},
        description: {},
        video: "",
      };
      initial.transportInformation.title[lang] =
        data.transportInformation.title?.[lang] || "";
      initial.transportInformation.description[lang] =
        data.transportInformation.description?.[lang] || "";
      initial.transportInformation.video =
        data.transportInformation.video || "";
    }
    if (data?.visitorPolicy) {
      initial.visitorPolicy = initial.visitorPolicy || {
        title: {},
        description: {},
        video: "",
      };
      initial.visitorPolicy.title[lang] =
        data.visitorPolicy.title?.[lang] || "";
      initial.visitorPolicy.description[lang] =
        data.visitorPolicy.description?.[lang] || "";
      initial.visitorPolicy.video = data.visitorPolicy.video || "";
    }
  });

  if (data?.additionalResources) {
    // Convert object to array if needed
    let docsArr = ["", "", "", ""];
    const docs = data.additionalResources.documents;
    if (Array.isArray(docs)) {
      docsArr = docs;
    } else if (docs && typeof docs === "object") {
      docsArr = [
        docs.houseRules || "",
        docs.serviceSchedules || "",
        docs.procedures || "",
        docs.serviceRules || "",
      ];
    }
    initial.additionalResources = {
      email: data.additionalResources.email || "",
      helplineNumber: data.additionalResources.helplineNumber || "",
      supportNumber: data.additionalResources.supportNumber || "",
      documents: docsArr,
    };
  }

  return initial;
};

const buildInitialValuesPrivacy = (data) => {
  const initial = { htmlDescription: {} };

  localeOptions.forEach((locale) => {
    const lang = locale.value;
    initial.htmlDescription[lang] = data?.htmlDescription?.[lang] || "";
  });

  return initial;
};

const buildInitialValuesLegal = (data) => {
  const initial = {
    title: {},
    htmlDescription: {},
  };

  localeOptions.forEach((locale) => {
    const lang = locale.value;
    initial.title[lang] = data?.title?.[lang] || "";
    initial.htmlDescription[lang] = data?.htmlDescription?.[lang] || "";
  });

  return initial;
};

const buildInitialValuesLanding = (data) => {
  const initial = {
    hero: {
      badge: {},
      title: {},
      subtitle: {},
    },
    footerCompany: {
      description: {},
    },
  };

  localeOptions.forEach((locale) => {
    const lang = locale.value;
    initial.hero.badge[lang] = data?.hero?.badge?.[lang] || "";
    initial.hero.title[lang] = data?.hero?.title?.[lang] || "";
    initial.hero.subtitle[lang] = data?.hero?.subtitle?.[lang] || "";
    initial.footerCompany.description[lang] =
      data?.footerCompany?.description?.[lang] || "";
  });

  return initial;
};

const validationSchema = (t) =>
  Yup.object({
    laundryService: Yup.object({
      title: getLanguageValidationSchema(t("formikSchema.laundryTitle")),
      description: getLanguageValidationSchema(
        t("formikSchema.laundryDescription"),
      ),
      video: Yup.string().notRequired(),
    }),
    maintenanceRequest: Yup.object({
      title: getLanguageValidationSchema(t("formikSchema.maintenanceTitle")),
      description: getLanguageValidationSchema(
        t("formikSchema.maintenanceDescription"),
      ),
      video: Yup.string().notRequired(),
    }),
    transportInformation: Yup.object({
      title: getLanguageValidationSchema(t("formikSchema.transportTitle")),
      description: getLanguageValidationSchema(
        t("formikSchema.transportDescription"),
      ),
      video: Yup.string().notRequired(),
    }),
    visitorPolicy: Yup.object({
      title: getLanguageValidationSchema(t("formikSchema.visitorTitle")),
      description: getLanguageValidationSchema(
        t("formikSchema.visitorDescription"),
      ),
      video: Yup.string().notRequired(),
    }),
    additionalResources: Yup.object({
      email: Yup.string().email(t("formikSchema.emailFormat")).notRequired(),
      helplineNumber: Yup.string().notRequired(),
      supportNumber: Yup.string().notRequired(),
      documents: Yup.array()
        .of(Yup.string().required(t("formikSchema.documentRequired")))
        .length(4, t("formikSchema.AllDocumentsRequired")),
    }),
  });

const isEmptyHtml = (value) => {
  if (!value) return true;
  const text = value.replace(/<[^>]+>/g, "").trim();
  return text.length === 0;
};

const getLanguageValidationSchema = (fieldLabel = "Field") => {
  const shape = {};
  localeOptions.forEach((locale) => {
    shape[locale.value] = Yup.string().test(
      "not-empty-html",
      `${fieldLabel} in ${locale.label} is required`,
      (val) => !isEmptyHtml(val),
    );
  });
  return Yup.object().shape(shape);
};

const validationSchemaPrivacy = () =>
  Yup.object({
    htmlDescription: getLanguageValidationSchema("htmlDescription"),
  });

const validationSchemaLegal = (t) =>
  Yup.object({
    title: getLanguageValidationSchema(t("formikSchema.legalTitle")),
    htmlDescription: getLanguageValidationSchema(
      t("formikSchema.legalHtmlDescription"),
    ),
  });

const validationSchemaLanding = (t) =>
  Yup.object({
    hero: Yup.object({
      badge: getLanguageValidationSchema(t("formikSchema.heroBadge")),
      title: getLanguageValidationSchema(t("formikSchema.heroTitle")),
      subtitle: getLanguageValidationSchema(t("formikSchema.heroSubtitle")),
    }),
    footerCompany: Yup.object({
      description: getLanguageValidationSchema(
        t("formikSchema.footerCompanyDescription"),
      ),
    }),
  });

const CmsSinglePage = ({ pageName }) => {
  const direction = useDirection();
  const [dir, setDir] = useState(direction);
  const { Get, Patch, Post } = useAxios();
  const [pageData, setPageData] = useState({});
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const { t, setLocale: setLocale1 } = useDynamicTranslations("cmsPage");
  const [uploading, setUploading] = useState("");
  const [videoUploading, setVideoUploading] = useState("");
  const c = useTranslations();
  const [translating, setTranslating] = useState(false);

  async function getData() {
    setLoading("initial");
    const { response } = await Get({
      route: `admin/cms/page/${pageName}`,
    });

    if (response) {
      let cleanedData = structuredClone(response?.data);

      cleanedData = removeUnwantedFields(cleanedData);
      setPageData(cleanedData);
      console.log(cleanedData, "cleanedData");
    }
    setLoading("");
  }

  // Formik setup
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: buildInitialValues(pageData),
    validationSchema: validationSchema(t),
    onSubmit: async (values) => {
      await handleUpdate(values);
    },
  });

  const formikPrivacy = useFormik({
    enableReinitialize: true,
    initialValues: buildInitialValuesPrivacy(pageData),
    validationSchema: validationSchemaPrivacy(),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      await handleUpdate(values);
    },
  });

  const formikLegal = useFormik({
    enableReinitialize: true,
    initialValues: buildInitialValuesLegal(pageData),
    validationSchema: validationSchemaLegal(t),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      await handleUpdate(values);
    },
  });

  const formikLanding = useFormik({
    enableReinitialize: true,
    initialValues: buildInitialValuesLanding(pageData),
    validationSchema: validationSchemaLanding(t),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      await handleUpdate(values);
    },
  });

  const UploadMediaFunction = async (files) => {
    if (files.length === 0) return [];
    setUploading(true);

    const formData = createFormData({ docs: files });
    const { response } = await Post({
      route: "media/upload",
      data: formData,
      isFormData: true,
    });

    setUploading(false);

    if (response?.status === "success") {
      const keys = response?.data?.docs?.map((obj) => obj?.key) || [];
      RenderToast({
        type: "success",
        message: t("toast.fileUploadedSuccessfully"),
      });
      return keys;
    }

    throw new Error("Failed to upload");
  };

  const UploadVideoFunction = async (files, componentId) => {
    if (files.length === 0) return [];
    setVideoUploading(componentId);

    try {
      const { response } = await Post({
        route: "media/upload",
        data: { videoCount: files.length },
      });

      if (response?.status === "success") {
        const keys = [];

        // Upload each file to its presigned URL
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const key = response?.data?.keys[i];
          const presignedUrl = response?.data?.urls[i];

          if (key && presignedUrl) {
            await axios.put(presignedUrl, file, {
              headers: {
                "Content-Type": file.type || "video/mp4",
              },
            });
            keys.push(key);
          }
        }

        setVideoUploading("");
        RenderToast({
          type: "success",
          message: t("toast.videoUploadedSuccessfully"),
        });
        return keys;
      }

      setVideoUploading("");
      throw new Error("Failed to get presigned URLs");
    } catch (error) {
      setVideoUploading("");
      console.error("Video upload error:", error);
      throw error;
    }
  };

  const handleUpdate = async (values) => {
    setLoading("saving");

    // Extract only keys from documents objects before sending to backend
    const processedValues = { ...values };
    if (processedValues.additionalResources?.documents) {
      processedValues.additionalResources.documents =
        processedValues.additionalResources.documents.map((doc) =>
          typeof doc === "object" ? doc.key : doc,
        );
    }

    const { response } = await Patch({
      route: `admin/cms/page/${pageName}`,
      data: processedValues,
    });
    if (response) {
      RenderToast({
        type: "success",
        message: t("successMessage"),
      });
      await getData();
    }
    setLoading("");
  };

  const handleSubmitActive = async (e) => {
    // Prevent form's default submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let activeFormik = formik;
    if (pageName === "privacyPolicyPage") {
      activeFormik = formikPrivacy;
    } else if (LEGAL_HTML_PAGES.includes(pageName)) {
      activeFormik = formikLegal;
    } else if (pageName === "landingPage") {
      activeFormik = formikLanding;
    }

    const errors = await activeFormik.validateForm();

    if (Object.keys(errors).length > 0) {
      RenderToast({
        type: "error",
        message: t("toast.requiredFields"),
      });
      return;
    }
    // Only submit if validation passes
    activeFormik.handleSubmit();
  };

  const getActiveFormik = () => {
    if (pageName === "privacyPolicyPage") return formikPrivacy;
    if (LEGAL_HTML_PAGES.includes(pageName)) return formikLegal;
    if (pageName === "landingPage") return formikLanding;
    return formik;
  };

  const getMultilingualFieldPaths = () => {
    if (pageName === "accommodationGuidePage") {
      return [
        "laundryService.title",
        "laundryService.description",
        "maintenanceRequest.title",
        "maintenanceRequest.description",
        "transportInformation.title",
        "transportInformation.description",
        "visitorPolicy.title",
        "visitorPolicy.description",
      ];
    }
    if (pageName === "privacyPolicyPage") {
      return ["htmlDescription"];
    }
    if (LEGAL_HTML_PAGES.includes(pageName)) {
      return ["title", "htmlDescription"];
    }
    if (pageName === "landingPage") {
      return [
        "hero.badge",
        "hero.title",
        "hero.subtitle",
        "footerCompany.description",
      ];
    }
    return [];
  };

  const getValueAtPath = (obj, path) =>
    path.split(".").reduce((acc, key) => acc?.[key], obj);

  async function translateMessages() {
    const activeFormik = getActiveFormik();
    const fields = getMultilingualFieldPaths().filter((field) => {
      const rootKey = field.split(".")[0];
      return activeFormik.values?.[rootKey] != null;
    });

    const missing = [];
    for (const field of fields) {
      const original =
        getValueAtPath(activeFormik.values, `${field}.${selectedLanguage}`) ||
        "";
      if (isEmptyHtml(original)) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      RenderToast({
        type: "error",
        message: `${t("pleaseFill")}: ${missing.join(", ")}`,
      });
      return;
    }

    setTranslating(true);

    for (const field of fields) {
      const original =
        getValueAtPath(activeFormik.values, `${field}.${selectedLanguage}`) ||
        "";

      await Promise.all(
        locales.map(async (lang) => {
          if (lang === selectedLanguage) return;
          try {
            const translated = await translateText(original, lang);
            activeFormik.setFieldValue(`${field}.${lang}`, translated);
          } catch (err) {
            // ignore translation errors
          }
        }),
      );
    }

    setTranslating(false);
    RenderToast({
      type: "success",
      message: t("translationSuccess"),
    });
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      {pageName === "accommodationGuidePage" && (
        <Container
          dir={dir}
          className={mergeClass(
            "containerFluid",
            classes?.main,
            dir === "ltr" ? "ignoreRtlNested" : "",
          )}
        >
          {" "}
          <TopHeader title={t("accommodationGuide")} />
          <LanguageSelector
            selected={selectedLanguage}
            setSelected={setSelectedLanguage}
            setDirection={setDir}
            cb={(loc) => {
              setLocale1(loc);
            }}
          />
          <Button
            label={translating ? t("translating") : t("autoFill")}
            onClick={translateMessages}
            disabled={loading === "saving" || translating}
          />
          {loading === "initial" ? (
            <SpinnerLoading />
          ) : (
            <form
              onSubmit={(e) => {
                formik.handleSubmit(e);
              }}
            >
              <div className={classes.container}>
                {/* Laundry Service */}
                {formik.values.laundryService && (
                  <div className={classes?.parentBox}>
                    <h3>{t("LaundryService")}</h3>
                    <Input
                      dir={dir}
                      label={t("TitleText")}
                      value={
                        formik.values.laundryService.title[selectedLanguage]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `laundryService.title.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.laundryService?.title?.[
                          selectedLanguage
                        ] &&
                        formik.errors.laundryService?.title?.[selectedLanguage]
                      }
                    />
                    <QuillInput
                      dir={dir}
                      label={t("DescriptionText")}
                      value={
                        formik.values.laundryService.description[
                          selectedLanguage
                        ]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `laundryService.description.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.laundryService?.description?.[
                          selectedLanguage
                        ] &&
                        formik.errors.laundryService?.description?.[
                          selectedLanguage
                        ]
                      }
                      readOnly={false}
                    />

                    <UploadMedia
                      fileDisplayName={t("videoFile")}
                      uploadMessage={c("uploadMedia.uploadMessageVideos")}
                      fileFormats={c("uploadMedia.fileFormatsVideos")}
                      loading={videoUploading === "laundryService"}
                      files={
                        formik.values.laundryService.video
                          ? [formik.values.laundryService.video]
                          : []
                      }
                      handleFileChange={async (files) => {
                        try {
                          const keys = await UploadVideoFunction(
                            files,
                            "laundryService",
                          );
                          formik.setFieldValue(
                            "laundryService.video",
                            keys[0] || "",
                          );
                        } catch (error) {
                          RenderToast({
                            type: "error",
                            message: "Video upload failed",
                          });
                        }
                      }}
                      handleRemoveFile={() =>
                        formik.setFieldValue("laundryService.video", "")
                      }
                      multiple={false}
                      accept="video/*"
                      maxFiles={1}
                      maxSizeMB={100}
                    />
                  </div>
                )}

                {/* Maintenance Request */}
                {formik.values.maintenanceRequest && (
                  <div className={classes?.parentBox}>
                    <h3>{t("MaintenanceRequest")}</h3>
                    <Input
                      dir={dir}
                      label={t("TitleText")}
                      value={
                        formik.values.maintenanceRequest.title[selectedLanguage]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `maintenanceRequest.title.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.maintenanceRequest?.title?.[
                          selectedLanguage
                        ] &&
                        formik.errors.maintenanceRequest?.title?.[
                          selectedLanguage
                        ]
                      }
                    />
                    <QuillInput
                      dir={dir}
                      label={t("DescriptionText")}
                      value={
                        formik.values.maintenanceRequest.description[
                          selectedLanguage
                        ]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `maintenanceRequest.description.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.maintenanceRequest?.description?.[
                          selectedLanguage
                        ] &&
                        formik.errors.maintenanceRequest?.description?.[
                          selectedLanguage
                        ]
                      }
                      readOnly={false}
                    />
                    {/* <UploadMedia
                      label="Video File"
                      value={formik.values.maintenanceRequest.video}
                      setValue={(val) =>
                        formik.setFieldValue("maintenanceRequest.video", val)
                      }
                    /> */}
                    <UploadMedia
                      fileDisplayName={t("videoFile")}
                      uploadMessage={c("uploadMedia.uploadMessageVideos")}
                      fileFormats={c("uploadMedia.fileFormatsVideos")}
                      loading={videoUploading === "maintenanceRequest"}
                      files={
                        formik.values.maintenanceRequest.video
                          ? [formik.values.maintenanceRequest.video]
                          : []
                      }
                      handleFileChange={async (files) => {
                        try {
                          const keys = await UploadVideoFunction(
                            files,
                            "maintenanceRequest",
                          );
                          formik.setFieldValue(
                            "maintenanceRequest.video",
                            keys[0] || "",
                          );
                        } catch (error) {
                          RenderToast({
                            type: "error",
                            message: "Video upload failed",
                          });
                        }
                      }}
                      handleRemoveFile={() =>
                        formik.setFieldValue("maintenanceRequest.video", "")
                      }
                      multiple={false}
                      accept="video/*"
                      maxFiles={1}
                      maxSizeMB={500}
                    />
                  </div>
                )}

                {/* Transport Information */}
                {formik.values.transportInformation && (
                  <div className={mergeClass(classes?.parentBox)}>
                    <h3>{t("TransportInformation")}</h3>
                    <Input
                      dir={dir}
                      label={t("TitleText")}
                      value={
                        formik.values.transportInformation.title[
                          selectedLanguage
                        ]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `transportInformation.title.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.transportInformation?.title?.[
                          selectedLanguage
                        ] &&
                        formik.errors.transportInformation?.title?.[
                          selectedLanguage
                        ]
                      }
                    />
                    <QuillInput
                      dir={dir}
                      label={t("DescriptionText")}
                      value={
                        formik.values.transportInformation.description[
                          selectedLanguage
                        ]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `transportInformation.description.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.transportInformation?.description?.[
                          selectedLanguage
                        ] &&
                        formik.errors.transportInformation?.description?.[
                          selectedLanguage
                        ]
                      }
                      readOnly={false}
                    />

                    <UploadMedia
                      fileDisplayName={t("videoFile")}
                      uploadMessage={c("uploadMedia.uploadMessageVideos")}
                      fileFormats={t("uploadMedia.fileFormatsVideos")}
                      loading={videoUploading === "transportInformation"}
                      files={
                        formik.values.transportInformation.video
                          ? [formik.values.transportInformation.video]
                          : []
                      }
                      handleFileChange={async (files) => {
                        try {
                          const keys = await UploadVideoFunction(
                            files,
                            "transportInformation",
                          );
                          formik.setFieldValue(
                            "transportInformation.video",
                            keys[0] || "",
                          );
                        } catch (error) {
                          RenderToast({
                            type: "error",
                            message: "Video upload failed",
                          });
                        }
                      }}
                      handleRemoveFile={() =>
                        formik.setFieldValue("transportInformation.video", "")
                      }
                      multiple={false}
                      accept="video/*"
                      maxFiles={1}
                      maxSizeMB={10}
                    />
                  </div>
                )}

                {/* Visitor Policy */}
                {formik.values.visitorPolicy && (
                  <div className={classes?.parentBox}>
                    <h3>{t("VisitorPolicy")}</h3>
                    <Input
                      dir={dir}
                      label={t("TitleText")}
                      value={
                        formik.values.visitorPolicy.title[selectedLanguage]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `visitorPolicy.title.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.visitorPolicy?.title?.[
                          selectedLanguage
                        ] &&
                        formik.errors.visitorPolicy?.title?.[selectedLanguage]
                      }
                    />
                    <QuillInput
                      dir={dir}
                      label={t("DescriptionText")}
                      value={
                        formik.values.visitorPolicy.description[
                          selectedLanguage
                        ]
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `visitorPolicy.description.${selectedLanguage}`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.visitorPolicy?.description?.[
                          selectedLanguage
                        ] &&
                        formik.errors.visitorPolicy?.description?.[
                          selectedLanguage
                        ]
                      }
                      readOnly={false}
                    />
                    <UploadMedia
                      fileDisplayName={t("videoFile")}
                      uploadMessage={c("uploadMedia.uploadMessageVideos")}
                      fileFormats={c("uploadMedia.fileFormatsVideos")}
                      loading={videoUploading === "visitorPolicy"}
                      files={
                        formik.values.visitorPolicy.video
                          ? [formik.values.visitorPolicy.video]
                          : []
                      }
                      handleFileChange={async (files) => {
                        try {
                          const keys = await UploadVideoFunction(
                            files,
                            "visitorPolicy",
                          );
                          formik.setFieldValue(
                            "visitorPolicy.video",
                            keys[0] || "",
                          );
                        } catch (error) {
                          RenderToast({
                            type: "error",
                            message: "Video upload failed",
                          });
                        }
                      }}
                      handleRemoveFile={() =>
                        formik.setFieldValue("visitorPolicy.video", "")
                      }
                      multiple={false}
                      accept="video/*"
                      maxFiles={1}
                      maxSizeMB={10}
                    />
                  </div>
                )}
                {/* Additional Resources */}
                {formik.values.additionalResources && (
                  <div className={classes?.parentBox}>
                    <h3>{t("AdditionalResources")}</h3>
                    <Input
                      dir={dir}
                      label={t("SupportEmail")}
                      value={formik.values.additionalResources.email || ""}
                      setValue={(val) =>
                        formik.setFieldValue(`additionalResources.email`, val)
                      }
                      errorText={
                        formik.touched.additionalResources?.email &&
                        formik.errors.additionalResources?.email
                      }
                    />
                    <Input
                      dir={dir}
                      label={t("HelplineNumber")}
                      value={
                        formik.values.additionalResources.helplineNumber || ""
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `additionalResources.helplineNumber`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.additionalResources?.helplineNumber &&
                        formik.errors.additionalResources?.helplineNumber
                      }
                    />
                    <Input
                      dir={dir}
                      label={t("SupportNumber")}
                      value={
                        formik.values.additionalResources.supportNumber || ""
                      }
                      setValue={(val) =>
                        formik.setFieldValue(
                          `additionalResources.supportNumber`,
                          val,
                        )
                      }
                      errorText={
                        formik.touched.additionalResources?.supportNumber &&
                        formik.errors.additionalResources?.supportNumber
                      }
                    />

                    {uploading ? (
                      <SpinnerLoading />
                    ) : (
                      <>
                        <UploadMedia
                          title={t("HouseRules")}
                          fileDisplayName={t("HouseRules")}
                          files={
                            formik.values.additionalResources.documents[0]
                              ? [formik.values.additionalResources.documents[0]]
                              : []
                          }
                          handleFileChange={async (files) => {
                            try {
                              const keys = await UploadMediaFunction(files);
                              formik.setFieldValue(
                                "additionalResources.documents[0]",
                                keys[0] || "",
                              );
                            } catch (error) {
                              RenderToast({
                                type: "error",
                                message: t("UploadFailed"),
                              });
                            }
                          }}
                          handleRemoveFile={() =>
                            formik.setFieldValue(
                              "additionalResources.documents[0]",
                              "",
                            )
                          }
                          error={
                            formik.touched.additionalResources
                              ?.documents?.[0] &&
                            formik.errors.additionalResources?.documents?.[0]
                          }
                          multiple={false}
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          maxFiles={1}
                          maxSizeMB={15}
                        />

                        <UploadMedia
                          title={t("ServiceSchedules")}
                          fileDisplayName={t("ServiceSchedules")}
                          files={
                            formik.values.additionalResources.documents[1]
                              ? [formik.values.additionalResources.documents[1]]
                              : []
                          }
                          handleFileChange={async (files) => {
                            try {
                              const keys = await UploadMediaFunction(files);
                              formik.setFieldValue(
                                "additionalResources.documents[1]",
                                keys[0] || "",
                              );
                            } catch (error) {
                              RenderToast({
                                type: "error",
                                message: t("UploadFailed"),
                              });
                            }
                          }}
                          handleRemoveFile={() =>
                            formik.setFieldValue(
                              "additionalResources.documents[1]",
                              "",
                            )
                          }
                          error={
                            formik.touched.additionalResources
                              ?.documents?.[1] &&
                            formik.errors.additionalResources?.documents?.[1]
                          }
                          multiple={false}
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          maxFiles={1}
                          maxSizeMB={15}
                        />

                        <UploadMedia
                          title={t("Procedures")}
                          fileDisplayName={t("Procedures")}
                          files={
                            formik.values.additionalResources.documents[2]
                              ? [formik.values.additionalResources.documents[2]]
                              : []
                          }
                          handleFileChange={async (files) => {
                            try {
                              const keys = await UploadMediaFunction(files);
                              formik.setFieldValue(
                                "additionalResources.documents[2]",
                                keys[0] || "",
                              );
                            } catch (error) {
                              RenderToast({
                                type: "error",
                                message: t("UploadFailed"),
                              });
                            }
                          }}
                          handleRemoveFile={() =>
                            formik.setFieldValue(
                              "additionalResources.documents[2]",
                              "",
                            )
                          }
                          error={
                            formik.touched.additionalResources
                              ?.documents?.[2] &&
                            formik.errors.additionalResources?.documents?.[2]
                          }
                          multiple={false}
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          maxFiles={1}
                          maxSizeMB={15}
                        />

                        <UploadMedia
                          title={t("ServiceRules")}
                          fileDisplayName={t("ServiceRules")}
                          files={
                            formik.values.additionalResources.documents[3]
                              ? [formik.values.additionalResources.documents[3]]
                              : []
                          }
                          handleFileChange={async (files) => {
                            try {
                              const keys = await UploadMediaFunction(files);
                              formik.setFieldValue(
                                "additionalResources.documents[3]",
                                keys[0] || "",
                              );
                            } catch (error) {
                              RenderToast({
                                type: "error",
                                message: t("UploadFailed"),
                              });
                            }
                          }}
                          handleRemoveFile={() =>
                            formik.setFieldValue(
                              "additionalResources.documents[3]",
                              "",
                            )
                          }
                          error={
                            formik.touched.additionalResources
                              ?.documents?.[3] &&
                            formik.errors.additionalResources?.documents?.[3]
                          }
                          multiple={false}
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          maxFiles={1}
                          maxSizeMB={15}
                        />
                      </>
                    )}
                  </div>
                )}

                <Button
                  label={t("update")}
                  variant="primary"
                  type="button"
                  disabled={
                    loading === "saving" ||
                    uploading ||
                    videoUploading !== "" ||
                    translating
                  }
                  loading={loading === "saving"}
                  showSpinner
                  onClick={handleSubmitActive}
                />
              </div>
            </form>
          )}
        </Container>
      )}

      {pageName === "privacyPolicyPage" && (
        <Container
          dir={dir}
          className={mergeClass(
            "containerFluid",
            classes?.main,
            dir === "ltr" ? "ignoreRtlNested" : "",
          )}
        >
          {/* <TopHeader title={capitalizeEachWord(pageName)} showBackBtn={false} /> */}
          <TopHeader title={t("privacyPolicy")} />
          <LanguageSelector
            selected={selectedLanguage}
            setSelected={setSelectedLanguage}
            setDirection={setDir}
            cb={(loc) => {
              setLocale1(loc);
            }}
          />
          <Button
            label={translating ? t("translating") : t("autoFill")}
            onClick={translateMessages}
            disabled={loading === "saving" || translating}
          />
          {loading === "initial" ? (
            <SpinnerLoading />
          ) : (
            <>
              <form onSubmit={formikPrivacy.handleSubmit}>
                <div className={classes?.mainBox}>
                  <h3>{t("formikSchema.privacy")}</h3>
                  <QuillInput
                    quillClass={classes?.quillMain}
                    dir={dir}
                    label={t("DescriptionText")}
                    value={
                      formikPrivacy.values.htmlDescription?.[selectedLanguage]
                    }
                    setValue={(val) =>
                      formikPrivacy.setFieldValue(
                        `htmlDescription.${selectedLanguage}`,
                        val,
                      )
                    }
                    errorText={
                      formikPrivacy.touched?.htmlDescription?.[
                        selectedLanguage
                      ] &&
                      formikPrivacy.errors?.htmlDescription?.[selectedLanguage]
                    }
                    readOnly={false}
                  />

                  <Button
                    label={t("update")}
                    variant="primary"
                    type="button"
                    disabled={
                      loading === "saving" ||
                      uploading ||
                      videoUploading ||
                      translating
                    }
                    loading={loading === "saving"}
                    showSpinner
                    onClick={handleSubmitActive}
                  />
                </div>
              </form>
            </>
          )}
        </Container>
      )}

      {LEGAL_HTML_PAGES.includes(pageName) && (
        <Container
          dir={dir}
          className={mergeClass(
            "containerFluid",
            classes?.main,
            dir === "ltr" ? "ignoreRtlNested" : "",
          )}
        >
          <TopHeader title={t(LEGAL_PAGE_TITLES[pageName])} />
          <LanguageSelector
            selected={selectedLanguage}
            setSelected={setSelectedLanguage}
            setDirection={setDir}
            cb={(loc) => {
              setLocale1(loc);
            }}
          />
          <Button
            label={translating ? t("translating") : t("autoFill")}
            onClick={translateMessages}
            disabled={loading === "saving" || translating}
          />
          {loading === "initial" ? (
            <SpinnerLoading />
          ) : (
            <form onSubmit={formikLegal.handleSubmit}>
              <div className={classes?.mainBox}>
                <Input
                  dir={dir}
                  label={t("TitleText")}
                  value={formikLegal.values.title?.[selectedLanguage]}
                  setValue={(val) =>
                    formikLegal.setFieldValue(`title.${selectedLanguage}`, val)
                  }
                  errorText={
                    formikLegal.touched?.title?.[selectedLanguage] &&
                    formikLegal.errors?.title?.[selectedLanguage]
                  }
                />
                <QuillInput
                  quillClass={classes?.quillMain}
                  dir={dir}
                  label={t("DescriptionText")}
                  value={formikLegal.values.htmlDescription?.[selectedLanguage]}
                  setValue={(val) =>
                    formikLegal.setFieldValue(
                      `htmlDescription.${selectedLanguage}`,
                      val,
                    )
                  }
                  errorText={
                    formikLegal.touched?.htmlDescription?.[selectedLanguage] &&
                    formikLegal.errors?.htmlDescription?.[selectedLanguage]
                  }
                  readOnly={false}
                />
                <Button
                  label={t("update")}
                  variant="primary"
                  type="button"
                  disabled={
                    loading === "saving" ||
                    uploading ||
                    videoUploading ||
                    translating
                  }
                  loading={loading === "saving"}
                  showSpinner
                  onClick={handleSubmitActive}
                />
              </div>
            </form>
          )}
        </Container>
      )}

      {pageName === "landingPage" && (
        <Container
          dir={dir}
          className={mergeClass(
            "containerFluid",
            classes?.main,
            dir === "ltr" ? "ignoreRtlNested" : "",
          )}
        >
          <TopHeader title={t("landingPage")} />
          <LanguageSelector
            selected={selectedLanguage}
            setSelected={setSelectedLanguage}
            setDirection={setDir}
            cb={(loc) => {
              setLocale1(loc);
            }}
          />
          <Button
            label={translating ? t("translating") : t("autoFill")}
            onClick={translateMessages}
            disabled={loading === "saving" || translating}
          />
          {loading === "initial" ? (
            <SpinnerLoading />
          ) : (
            <form onSubmit={formikLanding.handleSubmit}>
              <div className={classes.container}>
                <div className={classes.sectionBox}>
                  <h3>{t("heroSection")}</h3>
                  <Input
                    dir={dir}
                    label={t("badge")}
                    value={formikLanding.values.hero?.badge?.[selectedLanguage]}
                    setValue={(val) =>
                      formikLanding.setFieldValue(
                        `hero.badge.${selectedLanguage}`,
                        val,
                      )
                    }
                    errorText={
                      formikLanding.touched?.hero?.badge?.[selectedLanguage] &&
                      formikLanding.errors?.hero?.badge?.[selectedLanguage]
                    }
                  />
                  <Input
                    dir={dir}
                    label={t("TitleText")}
                    value={formikLanding.values.hero?.title?.[selectedLanguage]}
                    setValue={(val) =>
                      formikLanding.setFieldValue(
                        `hero.title.${selectedLanguage}`,
                        val,
                      )
                    }
                    errorText={
                      formikLanding.touched?.hero?.title?.[selectedLanguage] &&
                      formikLanding.errors?.hero?.title?.[selectedLanguage]
                    }
                  />
                  <Input
                    dir={dir}
                    label={t("subtitle")}
                    value={
                      formikLanding.values.hero?.subtitle?.[selectedLanguage]
                    }
                    setValue={(val) =>
                      formikLanding.setFieldValue(
                        `hero.subtitle.${selectedLanguage}`,
                        val,
                      )
                    }
                    errorText={
                      formikLanding.touched?.hero?.subtitle?.[
                        selectedLanguage
                      ] &&
                      formikLanding.errors?.hero?.subtitle?.[selectedLanguage]
                    }
                  />
                </div>

                <div className={classes.sectionBox}>
                  <h3>{t("footerCompanySection")}</h3>
                  <Input
                    dir={dir}
                    label={t("DescriptionText")}
                    value={
                      formikLanding.values.footerCompany?.description?.[
                        selectedLanguage
                      ]
                    }
                    setValue={(val) =>
                      formikLanding.setFieldValue(
                        `footerCompany.description.${selectedLanguage}`,
                        val,
                      )
                    }
                    errorText={
                      formikLanding.touched?.footerCompany?.description?.[
                        selectedLanguage
                      ] &&
                      formikLanding.errors?.footerCompany?.description?.[
                        selectedLanguage
                      ]
                    }
                  />
                </div>

                <Button
                  label={t("update")}
                  variant="primary"
                  type="button"
                  disabled={
                    loading === "saving" ||
                    uploading ||
                    videoUploading ||
                    translating
                  }
                  loading={loading === "saving"}
                  showSpinner
                  onClick={handleSubmitActive}
                />
              </div>
            </form>
          )}
        </Container>
      )}
    </>
  );
};

export default CmsSinglePage;
