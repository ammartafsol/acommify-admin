"use client";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import DashboardStatsCard from "@/components/molecules/DashboardStatsCards";
import DropDown from "@/components/molecules/DropDown/DropDown";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import moment from "moment";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import {
  FaBan,
  FaBed,
  FaBuilding,
  FaChild,
  FaFemale,
  FaMale,
  FaUserAlt,
  FaUserFriends,
  FaUsers,
  FaUsers as FaUsersAlt,
} from "react-icons/fa";
import { MdEmail, MdPhone } from "react-icons/md";
import { WeeklyCalendar } from "react-week-picker";
import styles from "./CentersWeeklyReports.module.css";

export default function CentersWeeklyReports() {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState("");
  const [centers, setCenters] = useState([]);
  const [value, setValue] = useState(null);
  const { Get } = useAxios();
  const language = useLocale();
  const [statsData, setStatsData] = useState({});
  const t = useTranslations("centersWeeklyReportsPage");

  const getAllCenters = async () => {
    setLoading("LoadingCenters");
    const { response } = await Get({
      route: "users/nation-wide/centres/all",
    });
    if (response) {
      const centers = response?.data?.map((center) => ({
        value: center.slug,
        label: center.centreName?.[language],
      }));

      setCenters(centers);
    }
    setLoading("");
  };

  useEffect(() => {
    getAllCenters();
  }, []);

  useEffect(() => {
    if (centers.length > 0) {
      setValue(centers[0]);
    }
  }, [centers]);

  const getWeeklyReportStats = async () => {
    setLoading("LoadingStats");
    const startParam = selectedWeek?.start
      ? moment(selectedWeek.start, "DD MMM YYYY").format("YYYY-MM-DD")
      : moment().startOf("week").format("YYYY-MM-DD");
    const endParam = selectedWeek?.end
      ? moment(selectedWeek.end, "DD MMM YYYY").format("YYYY-MM-DD")
      : moment().endOf("week").format("YYYY-MM-DD");

    const { response } = await Get({
      route: `users/detail/${value?.value}?startDate=${encodeURIComponent(
        startParam,
      )}&endDate=${encodeURIComponent(endParam)}`,
    });
    if (response) {
      setStatsData(response?.data);
    }
    setLoading("");
  };

  useEffect(() => {
    if (value) {
      getWeeklyReportStats();
    }
  }, [value, selectedWeek]);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      {loading === "LoadingCenters" ? (
        <SpinnerLoading />
      ) : (
        <>
          <div className={styles.subHeaderContainer}>
            <SubHeader title="Centers Weekly Reports" />

            <div className={styles.filtersContainer}>
              <DropDown
                value={value}
                setValue={setValue}
                options={centers}
                placeholder="Select Center"
                customStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  width: "200px",
                  height: "40px",
                }}
              />

              <div className={styles.datePickerContainer}>
                <div className={styles.datePicker}>
                  <WeeklyCalendar
                    onWeekPick={(startDate, endDate) =>
                      setSelectedWeek({ start: startDate, end: endDate })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  <FaUserAlt size={28} />
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>
                  {statsData?.fullName?.[language] || "-"}
                </div>
                <div className={styles.cardSubtitle}>
                  {statsData?.centreName?.[language] || "-"}
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  <MdEmail size={26} />
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>
                  {statsData?.email || "-"}
                </div>
                <div className={styles.cardSubtitle}>Email</div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>
                  <MdPhone size={24} />
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>
                  {statsData?.callingCode || ""}
                  {statsData?.phoneNumber || "-"}
                </div>
                <div className={styles.cardSubtitle}>Phone</div>
              </div>
            </div>
          </div>

          <DashboardStatsCard
            data={weeklyReportsStatsData(t, statsData)}
            cardContainerClass={styles?.cardContainerClass}
          />
        </>
      )}
    </Container>
  );
}

export const weeklyReportsStatsData = (t, data) => [
  {
    title: t("statsCards.contractedCapacity"),
    isIcon: true,
    icon: <FaBuilding size={26} color="#0ba5ec" />,
    total: data?.capacityStats?.contractedCapacity || 0,
  },
  {
    title: t("statsCards.occupancy"),
    isIcon: true,
    icon: <FaUsersAlt size={26} color="#0ba5ec" />,
    total: data?.capacityStats?.occupancy || 0,
  },
  {
    title: t("statsCards.unavailable"),
    isIcon: true,
    icon: <FaBan size={26} color="#0ba5ec" />,
    total: data?.capacityStats?.unavailable || 0,
  },
  {
    title: t("statsCards.useableVacancies"),
    isIcon: true,
    icon: <FaBed size={26} color="#0ba5ec" />,
    total: data?.capacityStats?.useableVacancies || 0,
  },
  {
    title: t("statsCards.numberOfChildren"),
    isIcon: true,
    icon: <FaChild size={26} color="#0ba5ec" />,
    total: data?.familyStats?.numberOfChildren || 0,
  },
  {
    title: t("statsCards.singleParent1Child"),
    isIcon: true,
    icon: <FaUserAlt size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleParent1Child || 0,
  },
  {
    title: t("statsCards.singleParent2Children"),
    isIcon: true,
    icon: <FaUserAlt size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleParent2Children || 0,
  },
  {
    title: t("statsCards.singleParent3Children"),
    isIcon: true,
    icon: <FaUserAlt size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleParent3Children || 0,
  },
  {
    title: t("statsCards.singleParent4Children"),
    isIcon: true,
    icon: <FaUserAlt size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleParent4Children || 0,
  },
  {
    title: t("statsCards.singleParent5Children"),
    isIcon: true,
    icon: <FaUserAlt size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleParent5Children || 0,
  },
  {
    title: t("statsCards.coupleNoChildren"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.coupleNoChildren || 0,
  },
  {
    title: t("statsCards.couple1Child"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.couple1Child || 0,
  },
  {
    title: t("statsCards.couple2Children"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.couple2Children || 0,
  },
  {
    title: t("statsCards.couple3Children"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.couple3Children || 0,
  },
  {
    title: t("statsCards.couple4Children"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.couple4Children || 0,
  },
  {
    title: t("statsCards.couple5Children"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.couple5Children || 0,
  },
  {
    title: t("statsCards.couple6Children"),
    isIcon: true,
    icon: <FaUserFriends size={26} color="#0ba5ec" />,
    total: data?.familyStats?.couple6Children || 0,
  },
  {
    title: t("statsCards.otherUnits"),
    isIcon: true,
    icon: <FaUsers size={26} color="#0ba5ec" />,
    total: data?.familyStats?.otherUnits || 0,
  },
  {
    title: t("statsCards.singleMales"),
    isIcon: true,
    icon: <FaMale size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleMales || 0,
  },
  {
    title: t("statsCards.singleFemales"),
    isIcon: true,
    icon: <FaFemale size={26} color="#0ba5ec" />,
    total: data?.familyStats?.singleFemales || 0,
  },
];
