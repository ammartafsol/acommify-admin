"use client";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import DashboardStatsCard from "@/components/molecules/DashboardStatsCards";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import DemographicBreakdown from "@/components/organisms/DemographicBreakdown/DemographicBreakdown";
import MaintenanceBarChart from "@/components/organisms/MaintenanceBarChart/MaintenanceBarChart";
import MaintenanceRequestChart from "@/components/organisms/MaintenanceRequestChart/MaintenanceRequestChart";
import ResidentsChart from "@/components/organisms/ResidentsChart/ResidentsChart";
import TotalVisitorChart from "@/components/organisms/TotalVisitorChart/TotalVisitorChart";
import { reportsStatsData } from "@/developmentContent/reportsAnalyticsData";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import classes from "./styles.module.css";

export default function ReportsAndAnalyticsTemplate() {
  const t = useTranslations("reportsAnalyticsPage");
  const { Get } = useAxios();
  const [loading, setLoading] = useState("initial");
  const [analyticsData, setAnalyticsData] = useState({});
  const [ethnicity, setEthnicity] = useState([]);
  const [MaintenanceRequest, setMaintenanceRequest] = useState([]);
  const [incidentReportsGraph, setIncidentReportsGraph] = useState([]);
  const [totalVisitorBookings, setTotalVisitorBookings] = useState("");
  const [demographicBreakdownData, setDemographicBreakdownData] = useState({});
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  async function getAnalyticsData({ year = yearFilter }) {
    if (loading !== "initial") {
      setLoading("loading");
    }
    const { response } = await Get({
      route: `admin/reports-and-analytics?year=${year}`,
    });
    if (response) {
      setAnalyticsData(response?.data || []);
      setEthnicity(response?.data.ethnicity);
      setMaintenanceRequest(response?.data.maintenanceRequestsGraph || []);
      setIncidentReportsGraph(response?.data.incidentReportsGraph || []);
      setTotalVisitorBookings(response?.data.totalVisitorBookings || "");
      setDemographicBreakdownData(response?.data.demographicBreakdown || {});
      // console.log(response?.data);
    }
    setLoading("");
  }
  useEffect(() => {
    getAnalyticsData({ year: yearFilter });
  }, [yearFilter]);

  return (
    <div className={classes.container}>
      <Container className="containerFluid">
        {loading === "initial" ? (
          <SpinnerLoading />
        ) : (
          <div className={classes.main}>
            <SubHeader
              title={t("title")}
              // buttonProps={{
              //   label: t("downloadReport"),
              //   // onClick: () => setShowModal(true),
              //   leftIcon: <MdOutlineFileDownload size={20} color="#33B5F6" />,
              //   variant: "",
              //   className: classes.downloadBtn,
              // }}
              topSearchSearchAndFilter={false}
            />

            <div className={classes.cards}>
              <div className={classes.cardsStats}>
                <DashboardStatsCard data={reportsStatsData(t, analyticsData)} />
              </div>
            </div>
            <ResidentsChart title={t("ethnicityTitle")} data={ethnicity} />

            <DemographicBreakdown
              title={t("demographicBreakdownTitle")}
              data={demographicBreakdownData}
            />

            <div className={classes.maintenanceChart}>
              <MaintenanceRequestChart
                data={incidentReportsGraph}
                title={t("incidentReportsTitle")}
                showTicks={true}
                residentsFilterBy={yearFilter}
                setResidentsFilterBy={setYearFilter}
                loading={loading}
              />
            </div>
            <div className={classes.cartsMain}>
              <div className={classes.totalVisitorsChart}>
                <TotalVisitorChart
                  data={totalVisitorBookings}
                  title={t("totalVisitorTitle")}
                />
              </div>
              <div className={classes.maintenanceBarChart}>
                <MaintenanceBarChart
                  data={MaintenanceRequest}
                  title={t("maintenanceRequestTitle")}
                />
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
