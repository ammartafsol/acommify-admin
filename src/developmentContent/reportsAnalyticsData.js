export const reportsStatsData = (t, data) => [
  {
    title: t("statsCards.onSite"),
    icon: "/svg/onsite.svg",
    total: data?.onsiteResidentsCount || 0,
    link: "/residents",
  },
  {
    title: t("statsCards.offSite"),
    icon: "/svg/offsite.svg",
    total: data?.offSiteResidentsCount || 0,
    link: "/residents",
  },
  {
    title: t("statsCards.totalStaffCount"),
    icon: "/svg/pendingReq.svg",
    total: data?.staffCount || 0,
    link: "/staffs",
  },
  {
    title: t("statsCards.maintenanceRequests"),
    icon: "/svg/maintenance.svg",
    total: data?.maintenanceRequests || 0,
    link: "/maintenance-requests",
  },
  {
    title: t("statsCards.upcomingAppointments"),
    icon: "/svg/appointments.svg",
    total: data?.upcomingAppointments || 0,
    link: "/appointments",
  },
  {
    title: t("statsCards.bedCount"),
    icon: "/svg/appointments.svg",
    total: data?.totalBeds || 0,
    link: "/rooms-houses",
  },
  {
    title: t("statsCards.totalVisitors"),
    icon: "/svg/appointments.svg",
    total: data?.totalVisitorBookings || 0,
    link: "/visitor-booking",
  },
];
