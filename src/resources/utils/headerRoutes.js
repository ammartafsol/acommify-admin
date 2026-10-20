import { isAdminOrBusinessOwner } from "./helper";

export const headerDataMobile = (t, permissions = [], user = {}) =>
  [
    permissions.includes("view-dashboard") && {
      label: t("adminHeader.dashboard"),
      route: "/dashboard",
      icon: "/svg/dashboardIcon.svg",
    },

    user?.role === "nation-wide" && {
      label: t("adminHeader.centersWeeklyReports"),
      route: "/centers-weekly-reports",
      icon: "/svg/reports.svg",
    },
    permissions.includes("view-business-owner") &&
      user?.role === "admin" && {
        label: t("adminHeader.businessAdmin"),
        route: "/centres",
        icon: "/svg/business-admin.svg",
      },

    permissions.includes("view-nation-wide") &&
      user?.role === "admin" && {
        label: t("adminHeader.nationWide"),
        route: "/nationwide-dashboard",
        icon: "/svg/dashboardIcon.svg",
      },

    permissions.includes("view-staff") && {
      label: t("adminHeader.staffs"),
      route: "/staffs",
      icon: "/svg/staff.svg",
    },
    permissions.includes("view-residents") && {
      label: t("adminHeader.residents"),
      route: "/residents",
      icon: "/svg/residents.svg",
    },
    permissions.includes("view-food-tokens") && {
      label: t("adminHeader.foodTokens"),
      route: "/food-tokens",
      icon: "/svg/coin.svg",
    },
    permissions.includes("view-maintenance-requests") && {
      label: t("adminHeader.maintenanceRequests"),
      icon: "/svg/maintainceReq.svg",
      route: "/maintenance-requests",
    },
    permissions.includes("view-accommodations") && {
      label: t("adminHeader.roomsHouses"),
      route: "/rooms-houses",
      icon: "/svg/house.svg",
    },
    permissions.includes("view-orders") && {
      label: t("adminHeader.ordersManagement"),
      icon: "/svg/orders.svg",
      route: "/orders",
    },
    permissions.includes("view-buses") && {
      label: t("adminHeader.busManagement"),
      icon: "/svg/busManagement.svg",
      route: "/bus-management",
    },
    permissions.includes("view-incident-reports") && {
      label: t("adminHeader.incidentReports"),
      route: "/incident-reports",
      icon: "/svg/incident.svg",
    },
    permissions.includes("view-products") &&
      permissions.includes("view-product-categories") && {
        label: t("adminHeader.manageItems"),
        route: "/manage-items",
        icon: "/svg/manageItems.svg",
      },
    permissions.includes("view-reports-and-analytics") && {
      label: t("adminHeader.reportsAnalytics"),
      route: "/reports-analytics",
      icon: "/svg/reports.svg",
    },
    // For timeslots and crud, add permission checks if needed, otherwise always show

    ((permissions.includes("view-staff") &&
      permissions.includes("see-appointments-slots")) ||
      (permissions.includes("view-machines") &&
        permissions.includes("see-laundry-slots")) ||
      (permissions.includes("view-accommodations") &&
        permissions.includes("see-visitor-slots")) ||
      isAdminOrBusinessOwner(user?.role)) && {
      label: t("adminHeader.timeslots"),
      route: "/time-slots",
      icon: "/svg/timeSlots.svg",
    },
    (permissions.includes("view-maintenance-request-categories") ||
      permissions.includes("view-machines") ||
      permissions.includes("view-faqs") ||
      permissions.includes("view-help-lines")) && {
      label: t("adminHeader.crud"),
      route: "/crud",
      icon: "/svg/crud.svg",
    },
    permissions.includes("view-cms") && {
      label: t("adminHeader.cms"),
      route: "/cms",
      icon: "/svg/cms.svg",
    },
  ].filter(Boolean);

export const headerData = (t, permissions = [], user = {}) =>
  [
    permissions.includes("view-dashboard") && {
      label: t("adminHeader.dashboard"),
      route: "/dashboard",
      icon: "/svg/dashboardIcon.svg",
    },
    permissions.includes("view-business-owner") &&
      user?.role === "admin" && {
        label: t("adminHeader.businessAdmin"),
        route: "/centres",
        icon: "/svg/business-admin.svg",
      },

    permissions.includes("view-nation-wide") &&
      user?.role === "admin" && {
        label: t("adminHeader.nationWide"),
        route: "/nationwide-dashboard",
        icon: "/svg/dashboardIcon.svg",
      },

    permissions.includes("view-staff") && {
      label: t("adminHeader.staffs"),
      route: "/staffs",
      icon: "/svg/staff.svg",
    },
    permissions.includes("view-accommodations") && {
      label: t("adminHeader.roomsHouses"),
      route: "/rooms-houses",
      icon: "/svg/house.svg",
    },
    permissions.includes("view-maintenance-requests") && {
      label: t("adminHeader.maintenanceRequests"),
      icon: "/svg/maintainceReq.svg",
      route: "/maintenance-requests",
    },
    permissions.includes("view-residents") && {
      label: t("adminHeader.residents"),
      route: "/residents",
      icon: "/svg/residents.svg",
    },
    permissions.includes("view-buses") && {
      label: t("adminHeader.busManagement"),
      icon: "/svg/busManagement.svg",
      route: "/bus-management",
    },
    permissions.includes("view-food-tokens") && {
      label: t("adminHeader.foodTokens"),
      route: "/food-tokens",
      icon: "/svg/coin.svg",
    },
    permissions.includes("view-orders") && {
      label: t("adminHeader.ordersManagement"),
      icon: "/svg/orders.svg",
      route: "/orders",
    },
    permissions.includes("view-incident-reports") && {
      label: t("adminHeader.incidentReports"),
      route: "/incident-reports",
      icon: "/svg/incident.svg",
    },
    permissions.includes("view-products") &&
      permissions.includes("view-product-categories") && {
        label: t("adminHeader.manageItems"),
        route: "/manage-items",
        icon: "/svg/manageItems.svg",
      },

    ((permissions.includes("view-staff") &&
      permissions.includes("see-appointments-slots")) ||
      (permissions.includes("view-machines") &&
        permissions.includes("see-laundry-slots")) ||
      (permissions.includes("view-accommodations") &&
        permissions.includes("see-visitor-slots")) ||
      isAdminOrBusinessOwner(user?.role)) && {
      label: t("adminHeader.timeslots"),
      route: "/time-slots",
      icon: "/svg/timeSlots.svg",
    },

    (permissions.includes("view-cms") ||
      permissions.includes("view-reports-and-analytics") ||
      permissions.includes("view-maintenance-request-categories") ||
      permissions.includes("view-machines") ||
      permissions.includes("view-faqs") ||
      permissions.includes("view-help-lines") ||
      permissions.includes("view-positions")) && {
      label: t("adminHeader.AnalyticsManagement"),
      icon: "/svg/reports.svg",
      children: [
        permissions.includes("view-reports-and-analytics") && {
          label: t("adminHeader.reportsAnalytics"),
          route: "/reports-analytics",
          icon: "/svg/reports.svg",
        },

        permissions.includes("view-cms") && {
          label: t("adminHeader.cms"),
          route: "/cms",
          icon: "/svg/cms.svg",
        },
        (permissions.includes("view-maintenance-request-categories") ||
          permissions.includes("view-machines") ||
          permissions.includes("view-faqs") ||
          permissions.includes("view-help-lines") ||
          permissions.includes("view-positions")) && {
          label: t("adminHeader.crud"),
          route: "/crud",
          icon: "/svg/crud.svg",
        },
      ].filter(Boolean),
    },

    user?.role === "nation-wide" && {
      label: t("adminHeader.centersWeeklyReports"),
      route: "/centers-weekly-reports",
      icon: "/svg/reports.svg",
    },
  ].filter(Boolean);
