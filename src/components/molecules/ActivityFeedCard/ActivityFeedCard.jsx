import React, { useEffect, useMemo, useState } from "react";
import classes from "./styles.module.css";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import { useLocale } from "next-intl";
import { useTranslations } from "@/resources/hooks/useTranslations";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import moment from "moment-timezone";
import { LaundryDetailModal } from "@/components/templates/LaundryBooking";
import { BusDetailModal } from "@/components/templates/BusBookings";
import { MaintenanceRequestDetailModal } from "@/components/templates/MaintenanceRequests/MaintenanceRequests";
import { IncidentReportDetail } from "@/components/templates/IncidentReports/IncidentReports";
import { VisitorDetailModal } from "@/components/templates/VisitorBooking";
import { AppointmentDetailModal } from "@/components/templates/Appointments";

export default function ActivityFeedCard({ dataCard = [] }) {
  const language = useLocale();
  const [show, setShow] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const t = useTranslations("dashboardPage");

  useEffect(() => {
    if (!show) {
      setSelectedActivity(null);
    }
  }, [show]);

  const handleClick = (data) => {
    setShow(true);
    setSelectedActivity(data);
  };

  const ModalComponent = useMemo(() => {
    if (selectedActivity?.bookingId) {
      switch (selectedActivity?.serviceType) {
        case "laundry":
          return LaundryDetailModal;
        case "bus":
          return BusDetailModal;
        case "accommodation":
          return VisitorDetailModal;
        case "staff":
          return AppointmentDetailModal;
        default:
          return null;
      }
    } else if (selectedActivity?.requestId) {
      return MaintenanceRequestDetailModal;
    } else if (selectedActivity?.incidentId) {
      return IncidentReportDetail;
    }
    return null;
  }, [selectedActivity]);

  if (!Array.isArray(dataCard) || dataCard.length === 0) {
    return (
      <div className={classes.activitiesCardContainer}>{t("noActivity")}</div>
    );
  }

  return (
    <>
      {dataCard.map((activity, idx) => {
        // common top area
        const key = activity._id || idx;
        return (
          <button
            key={key}
            className={classes.activitiesCardContainer}
            onClick={() => handleClick(activity)}
          >
            <div className={classes.activityFeedTop}>
              <RenderStatusCell status={activity.status} />
              {activity.actions && (
                <DropdownMenu data={activity.actions} isVertical />
              )}
            </div>

            {/* Title */}
            <div className={classes.activityTop}>
              <h5>
                {activity?.bookingId ? (
                  <>
                    <span className={classes.label}>
                      {t("activity.labels.bookingId")}:
                    </span>{" "}
                    {activity?.bookingId}
                  </>
                ) : activity.incidentId ? (
                  <>
                    <span className={classes.label}>
                      {t("activity.labels.incidentId")}:
                    </span>{" "}
                    {activity?.incidentId}
                  </>
                ) : activity.requestId ? (
                  <>
                    <span className={classes.label}>
                      {t("activity.labels.requestId")}:
                    </span>{" "}
                    {activity?.requestId}
                  </>
                ) : (
                  activity?.title?.[language] || activity?.title || "-"
                )}
              </h5>
            </div>

            {/* Body details */}
            <div className={classes.activitiesCardBody}>
              {activity.bookingId && (
                <>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.resident")}:
                    </span>{" "}
                    {activity?.user?.fullName?.[language] ||
                      activity?.user?.fullName?.en ||
                      "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.serviceType")}:
                    </span>{" "}
                    {activity?.serviceType || "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.start")}:
                    </span>{" "}
                    {activity?.bookingStartDate
                      ? moment(activity.bookingStartDate).format(
                          "MMMM Do YYYY, h:mm A",
                        )
                      : "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.end")}:
                    </span>{" "}
                    {activity?.bookingEndDate
                      ? moment(activity.bookingEndDate).format(
                          "MMMM Do YYYY, h:mm A",
                        )
                      : "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.created")}:
                    </span>{" "}
                    {activity?.createdAt
                      ? moment(activity.createdAt).format(
                          "MMMM Do YYYY, h:mm A",
                        )
                      : "-"}
                  </div>
                </>
              )}

              {activity.incidentId && (
                <>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.title")}:
                    </span>{" "}
                    {activity?.title?.[language] || activity?.title?.en || "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.description")}:
                    </span>{" "}
                    {activity?.description?.[language] ||
                      activity?.description?.en ||
                      activity?.description ||
                      "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.severity")}:
                    </span>{" "}
                    {activity?.severity || "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.address")}:
                    </span>{" "}
                    {activity?.address?.[language] ||
                      activity?.address?.en ||
                      "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.resident")}:
                    </span>{" "}
                    {activity?.residentInvolved?.fullName?.[language] ||
                      activity?.residentInvolved?.fullName?.en ||
                      "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.created")}:
                    </span>{" "}
                    {activity?.createdAt
                      ? moment(activity.createdAt).format(
                          "MMMM Do YYYY, h:mm A",
                        )
                      : "-"}
                  </div>
                </>
              )}

              {activity.requestId && (
                <>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.description")}:
                    </span>{" "}
                    {activity?.description || "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.resident")}:
                    </span>{" "}
                    {activity?.user?.fullName?.[language] ||
                      activity?.user?.fullName?.en ||
                      "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.houseNumber")}:
                    </span>{" "}
                    {activity?.accommodation?.accommodationNumber || "-"}
                  </div>
                  <div>
                    <span className={classes.label}>
                      {t("activity.labels.created")}:
                    </span>{" "}
                    {activity?.createdAt
                      ? moment(activity.createdAt).format(
                          "MMMM Do YYYY, h:mm A",
                        )
                      : "-"}
                  </div>
                </>
              )}
            </div>
          </button>
        );
      })}
      {ModalComponent && (
        <ModalComponent show={show} setShow={setShow} data={selectedActivity} />
      )}
    </>
  );
}
