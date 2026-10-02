"use client";
import { useRouter } from "@/i18n/navigation";
import { capitalizeEachWord, mergeClass } from "@/resources/utils/helper";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import Image from "next/image";
import { FaCircleCheck } from "react-icons/fa6";
import { ReactSVG } from "react-svg";
import classes from "./BusTimeDetailCard.module.css";

function getDuration(start, end) {
  if (!start || !end) return "-";

  // Handle both ISO date strings and "HH:mm" format
  let startMoment, endMoment;

  // Check if it's an ISO date string (contains 'T' or is a full date)
  if (
    typeof start === "string" &&
    (start.includes("T") || start.includes("-"))
  ) {
    startMoment = moment(start);
  } else {
    // Try parsing as "HH:mm" format
    startMoment = moment(start, "HH:mm");
  }

  if (typeof end === "string" && (end.includes("T") || end.includes("-"))) {
    endMoment = moment(end);
  } else {
    // Try parsing as "HH:mm" format
    endMoment = moment(end, "HH:mm");
  }

  // Check if moments are valid
  if (!startMoment.isValid() || !endMoment.isValid()) {
    return "-";
  }

  let duration = moment.duration(endMoment.diff(startMoment));

  // Handle negative duration (overnight buses)
  if (duration.asMinutes() < 0) {
    // Add 1 day to end time and recalculate
    endMoment = moment(end);
    if (typeof end === "string" && (end.includes("T") || end.includes("-"))) {
      endMoment = moment(end).add(1, "day");
    } else {
      endMoment = moment(end, "HH:mm").add(1, "day");
    }
    duration = moment.duration(endMoment.diff(startMoment));
  }

  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  let str = "";
  if (hours > 0) str += `${hours}h `;
  if (minutes > 0) str += `${minutes}m`;
  return str.trim() || "-";
}

function formatTime(timeStr) {
  if (!timeStr) return "-";

  // Handle both ISO date strings and "HH:mm" format
  let timeMoment;
  if (
    typeof timeStr === "string" &&
    (timeStr.includes("T") || timeStr.includes("-"))
  ) {
    // ISO date string
    timeMoment = moment(timeStr);
  } else {
    // "HH:mm" format
    timeMoment = moment(timeStr, "HH:mm");
  }

  if (!timeMoment.isValid()) return "-";

  return timeMoment.format("hh:mm A");
}

export default function BusTimeDetailCard({
  bus,
  containerClass,
  showStatus = true,
  t,
}) {
  // console.log("bus", bus);
  const router = useRouter();
  const locale = useLocale();

  const startTime = bus?.bookingStartDate;
  const endTime = bus?.bookingEndDate;
  const duration = getDuration(startTime, endTime);

  return (
    <div
      className={mergeClass(classes.container, containerClass)}
      // onClick={() => router.push(`/resident/bus-booking/${bus?.slug}`)}
    >
      <div className={classes?.busMain}>
        <div className={classes.top}>
          <div className={classes.topLeft}>
            <div className={classes.busIcon}>
              <ReactSVG src={"/svg/greenBus.svg"} height={23} width={25} />
            </div>
            <p>{bus?.bus?.name?.[locale] || "-"}</p>
          </div>
          <div className={classes.secondMain}>
            <p>{bus?.bus?.name?.[locale] || "-"}</p>
            <p>{bus?.bus?.startingPointAddress?.[locale] || "-"}</p>
          </div>
          <div
            style={{ display: showStatus ? "block" : "none" }}
            className={
              bus?.bus?.available
                ? classes.availableStatus
                : classes.bookedStatus
            }
          >
            <FaCircleCheck
              size={16}
              color={bus?.bus?.available ? "#05CD99" : "#F86969"}
            />
            <p
              className={
                bus?.bus?.available ? classes.available : classes.booked
              }
            >
              {bus?.bus?.available ? t("available") : t("booked")}
            </p>
          </div>
        </div>
        <div className={classes.content}>
          <div className={classes.contentTop}>
            <p>{bus?.bus?.startingPointAddress?.[locale] || "-"}</p>
            <p>{bus?.bus?.endingPointAddress?.[locale] || "-"}</p>
          </div>
          <div className={classes.contentMiddle}>
            <p>{formatTime(bus?.bookingStartDate)}</p>
            <div className={classes.routeImg}>
              <Image src="/svg/sourceDestination.svg" alt="point" fill />
            </div>
            <p>{formatTime(bus?.bookingEndDate)}</p>
          </div>
          <div className={classes.contentBottom}>
            <p>{moment(bus?.bus?.schedule?.createdAt).format("MMM D, YYYY")}</p>
            <p>
              {t("duration")} {duration}
            </p>
            <p>{moment(bus?.bus?.schedule?.createdAt).format("MMM D, YYYY")}</p>
          </div>
        </div>
        <div className={classes?.dateHeader}>
          <p>
            <span>{t("date")}:</span>
            <span>
              {moment(bus?.bus?.schedule?.createdAt).format("MMM D, YYYY")}
            </span>
          </p>
          <p>
            <span>{t("departure")}:</span>
            {/* <span>
              {moment(bus?.bus?.schedule?.endTime, "HH:mm").format("hh:mm A")}
            </span> */}
            <p>
              {capitalizeEachWord(
                bus?.bus?.endingPointAddress?.[locale] || "-"
              )}
            </p>
          </p>
        </div>
        <div className={classes.bottom}>
          <p>
            <span>{t("seatsAvailable")}:</span> {bus?.bus?.seatsAvailable}/
            {bus?.bus?.capacity}
          </p>
        </div>
      </div>
    </div>
  );
}
