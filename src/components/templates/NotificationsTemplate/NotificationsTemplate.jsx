"use client";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import NotificationCard from "@/components/molecules/NotificationCard/NotificationCard";
import Pagination from "@/components/molecules/Pagination";
import TopHeader from "@/components/molecules/TopHeader/TopHeader";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import classes from "./styles.module.css";

export default function NotificationsTemplate() {
  const t = useTranslations("notificationPage");

  const { Get } = useAxios();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const getAllNotifications = async ({ page_ = page }) => {
    const sParams = new URLSearchParams({
      page: page_,
      limit: RECORDS_LIMIT,
    });
    setLoading(true);
    const { response } = await Get({
      route: `admin/notifications/all?${sParams.toString()}`,
    });
    setLoading(false);
    if (response?.status === "success") {
      setNotifications(response?.data || []);
      setTotalRecords(response?.totalRecords || 0);
    }
  };

  useEffect(() => {
    getAllNotifications({ page_: 1 });
  }, []);

  return (
    <div className={classes.main}>
      <Container className="containerFluid">
        <div className={classes.content}>
          {loading ? (
            <SpinnerLoading />
          ) : (
            <>
              <TopHeader title={t("title")} />
              <div className={classes.notificationCards}>
                {notifications.length === 0 ? (
                  <p className={classes.noData}>{t("noNotifications")}</p>
                ) : (
                  <NotificationCard notifications={notifications} />
                )}
              </div>
              {totalRecords > RECORDS_LIMIT && (
                <Pagination
                  currentPage={page}
                  totalRecords={totalRecords}
                  limit={RECORDS_LIMIT}
                  setCurrentPage={(p) => {
                    setPage(p);
                    getAllNotifications({ page_: p });
                  }}
                />
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
