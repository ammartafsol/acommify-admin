import { isAdminOrBusinessOwner } from "./helper";

export const RECORDS_LIMIT = 10;

export const AuthRoutes = [
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  "user-agreement",
];

export const CrudData = (t, permissions, role) =>
  [
    (permissions.includes("view-maintenance-request-categories") ||
      permissions.includes("add-edit-maintenance-request-category")) && {
      title: t("crudData.maintenanceCategories"),
      icon: "/svg/maintenance.svg",
      router: "/crud/crud-maintenance-categories",
    },
    (permissions.includes("view-machines") ||
      permissions.includes("add-edit-machine")) && {
      title: t("crudData.laundaryMachineCategories"),
      icon: "/svg/maintenance.svg",
      router: "/crud/crud-machine",
    },
    (permissions.includes("view-faqs") ||
      permissions.includes("add-edit-faq")) && {
      title: t("crudData.FAQs"),
      icon: "/svg/maintenance.svg",
      router: "/crud/crud-faqs",
    },

    (permissions.includes("view-help-lines") ||
      permissions.includes("add-edit-help-line")) && {
      title: t("crudData.helplines"),
      icon: "/svg/maintenance.svg",
      router: "/crud/crud-helplines",
    },
    (permissions.includes("view-positions") ||
      permissions.includes("add-edit-position")) && {
      title: t("crudData.positions"),
      icon: "/svg/maintenance.svg",
      router: "/crud/crud-positions",
    },

    isAdminOrBusinessOwner(role) && {
      title: t("crudData.configuration"),
      icon: "/svg/maintenance.svg",
      router: "/crud/crud-configuration",
    },
  ].filter(Boolean);

export const CMSData = (t) => [
  {
    title: t("cmsData.landingPage"),
    icon: "/svg/maintenance.svg",
    router: `/cms/landingPage`,
  },
  {
    title: t("cmsData.accommodationGuide"),
    icon: "/svg/maintenance.svg",
    router: `/cms/accommodationGuidePage`,
  },
  {
    title: t("cmsData.privacyPolicy"),
    icon: "/svg/maintenance.svg",
    router: `/cms/privacyPolicyPage`,
  },
  {
    title: t("cmsData.termsAndConditions"),
    icon: "/svg/maintenance.svg",
    router: `/cms/termsAndConditionsPage`,
  },
  {
    title: t("cmsData.dataProcessingAgreement"),
    icon: "/svg/maintenance.svg",
    router: `/cms/dataProcessingAgreementPage`,
  },
  {
    title: t("cmsData.cookiePolicy"),
    icon: "/svg/maintenance.svg",
    router: `/cms/cookiePolicyPage`,
  },
  {
    title: t("cmsData.accessibilityStatement"),
    icon: "/svg/maintenance.svg",
    router: `/cms/accessibilityStatementPage`,
  },
];
