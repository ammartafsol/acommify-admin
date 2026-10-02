"use client";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import ActivityFeedCard from "@/components/molecules/ActivityFeedCard/ActivityFeedCard";
import DashboardCard from "@/components/molecules/DashboardCard";
import DashboardStatsCard from "@/components/molecules/DashboardStatsCards";
import NotificationCard from "@/components/molecules/NotificationCard/NotificationCard";
import Tabs from "@/components/molecules/Tabs/Tabs";
import MaintenanceRequestChart from "@/components/organisms/MaintenanceRequestChart/MaintenanceRequestChart";
import { activityTabs, chartData } from "@/developmentContent/dashboardData";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { isAdminOrBusinessOwner, mergeClass } from "@/resources/utils/helper";
import { use, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import styles from "./styles.module.css";

export default function Dashboard() {
  const { permissions } = useSelector((state) => state.authReducer);
  const { user } = useSelector((state) => state.authReducer);
  const t = useTranslations("dashboardPage");
  const [selectedTab, setSelectedTab] = useState(activityTabs(t)[0]);
  const { Get } = useAxios();
  const [loading, setLoading] = useState({
    graph: false,
    initial: true,
  });
  const [statsData, setStatsData] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentMaintenanceRequests, setRecentMaintenanceRequests] = useState(
    [],
  );
  const [residentsFilterBy, setResidentsFilterBy] = useState(
    new Date().getFullYear(),
  );
  const [recentIncidentReports, setRecentIncidentReports] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  async function getAllStats({ filterBy }) {
    const params = new URLSearchParams({
      ...(filterBy && { year: filterBy }),
    });
    setLoading((prev) => ({ ...prev, graph: true, initial: loading.initial }));

    const { response } = await Get({
      route: `admin/dashboard?${params.toString()}`,
    });
    if (response) {
      setStatsData(response?.data);
      setGraphData(response?.data?.graph);
      setRecentBookings(response?.data?.recentBookings);
      setRecentIncidentReports(response?.data?.recentIncidentReports);
      setRecentMaintenanceRequests(response?.data?.recentMaintenanceRequests);
      setRecentNotifications(response?.data?.recentNotifications);
    }
    setLoading((prev) => ({ ...prev, graph: false, initial: false }));
  }

  const getNationwideStats = async () => {
    setLoading((prev) => ({ ...prev, graph: true, initial: loading.initial }));
    const { response } = await Get({
      route: `users/dashboard`,
    });
    if (response) {
      setStatsData(response?.data);
    }
    setLoading((prev) => ({ ...prev, graph: false, initial: false }));
  };

  useEffect(() => {
    if (isAdminOrBusinessOwner(user?.role)) {
      getAllStats({ filterBy: residentsFilterBy });
    } else if (user?.role === "nation-wide") {
      getNationwideStats();
    }
  }, [residentsFilterBy]);

  return (
    <Container className={mergeClass("containerFluid", styles?.main)}>
      {loading.initial ? (
        <SpinnerLoading />
      ) : (
        <div className={styles?.containerClass}>
          <div className={styles?.dashboardContainer}>
            <div className={styles?.leftMain}>
              {isAdminOrBusinessOwner(user?.role) && (
                <DashboardStatsCard
                  data={statsCardsData(t, statsData)}
                  cardContainerClass={styles?.cardContainerClass}
                />
              )}

              {user?.role === "nation-wide" && (
                <DashboardStatsCard
                  data={statsCardsDataNationwide(t, statsData)}
                  cardContainerClass={styles?.cardContainerClass}
                />
              )}

              <DashboardCard data={dashboardRoutesData(t, permissions)} />
              {isAdminOrBusinessOwner(user?.role) && (
                <MaintenanceRequestChart
                  loading={loading.graph}
                  data={graphData}
                  title={chartData(t)?.title}
                  showTicks={true}
                  setResidentsFilterBy={setResidentsFilterBy}
                  residentsFilterBy={residentsFilterBy}
                />
              )}
            </div>

            {isAdminOrBusinessOwner(user?.role) && (
              <div className={styles?.rightMain}>
                <div className={styles?.activitiesCardMain}>
                  <div className={styles?.cardMainData}>
                    <h1>{t("notification.recentNotification")}</h1>
                    <p>{t("notification.currentNotification")}</p>
                  </div>
                  <NotificationCard notifications={recentNotifications} />
                </div>

                <div className={styles?.activitiesCardMain}>
                  <div className={styles?.cardMainData}>
                    <h1>{t("activity.recentActivity")}</h1>
                    <p>{t("activity.currentActivity")}</p>
                  </div>
                  <Tabs
                    tabsData={activityTabs(t)}
                    selected={selectedTab}
                    setSelected={setSelectedTab}
                    ulCustom={styles?.ulClass}
                  />

                  <div className={styles?.recentTabs}>
                    <ActivityFeedCard
                      dataCard={
                        selectedTab.value === "booking"
                          ? recentBookings
                          : selectedTab.value === "maintenance"
                            ? recentMaintenanceRequests
                            : selectedTab.value === "incident" &&
                              recentIncidentReports
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}

export const dashboardRoutesData = (t, permissions) =>
  [
    permissions.includes("view-laundry-bookings") && {
      label: t("dashboardCards.bookLaundry"),
      icon: "/svg/laundry.svg",
      route: "/laundry-booking",
    },
    permissions.includes("view-bus-bookings") && {
      label: t("dashboardCards.bookBus"),
      icon: "/svg/bus.svg",
      route: "/bus-booking",
    },
    permissions.includes("view-staff-bookings") && {
      label: t("dashboardCards.bookAppointment"),
      icon: "/svg/appointment.svg",
      route: "/appointments",
    },

    permissions.includes("view-visitor-bookings") && {
      label: t("dashboardCards.visitorBooking"),
      icon: "/svg/peopleGroup.svg",
      route: "/visitor-booking",
    },

    permissions.includes("view-documents") && {
      label: t("dashboardCards.documentCenter"),
      icon: "/svg/document.svg",
      route: "/document-center",
    },
    permissions.includes("view-accommodation-checkin-checkout-logs") && {
      label: t("dashboardCards.signInSignOut"),
      icon: "/svg/clock.svg",
      route: "/sign-in-out",
    },
  ].filter(Boolean);

export const statsCardsData = (t, data) => [
  {
    title: t("statsCards.onSite"),
    icon: "/svg/onsite.svg",
    total: data?.onsiteResidentsCount || 0,
    router: "/residents",
  },
  {
    title: t("statsCards.offSite"),
    icon: "/svg/offsite.svg",
    total: data?.offSiteResidentsCount || 0,
    router: "/residents",
  },
  {
    title: t("statsCards.pendingRequests"),
    icon: "/svg/pendingReq.svg",
    total: data?.pendingBookings || 0,
  },
  {
    title: t("statsCards.maintenanceRequests"),
    icon: "/svg/maintenance.svg",
    total: data?.pendingMaintenanceRequests || 0,
    router: "/maintenance-requests",
  },
  {
    title: t("statsCards.upcomingAppointments"),
    icon: "/svg/appointments.svg",
    total: data?.upcomingAppointments || 0,
    router: "/appointments",
  },
  {
    title: t("statsCards.staffCount"),
    icon: "/svg/appointments.svg",
    total: data?.staffCount || 0,
    router: "/staffs",
  },
];

export const statsCardsDataNationwide = (t, data) => [
  {
    title: t("statsCards.totalResidents"),
    icon: "/svg/onsite.svg",
    total: data?.totalResidents || 0,
    // router: "/residents",
  },
  {
    title: t("statsCards.totalAdults"),
    icon: "/svg/offsite.svg",
    total: data?.totalAdults || 0,
  },
  {
    title: t("statsCards.nationalOccupancy"),
    icon: "/svg/pendingReq.svg",
    total: data?.totalOccupancy || 0,
  },
  {
    title: t("statsCards.activeCenters"),
    icon: "/svg/maintenance.svg",
    total: data?.totalActiveCentres || 0,
  },
  {
    title: t("statsCards.totalChildren"),
    icon: "/svg/appointments.svg",
    total: data?.totalChildren || 0,
  },
];
