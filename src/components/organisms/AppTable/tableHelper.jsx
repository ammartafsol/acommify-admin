"use client";

import {
  capitalizeEachWord,
  imageUrl,
  mergeClass,
} from "@/resources/utils/helper";
import moment from "moment";
import styles from "./tableHelper.module.css";
import { Form } from "react-bootstrap";
import Image from "next/image";
import { statusTranslations } from "@/constants/status";
import { useLocale } from "next-intl";

// export function RenderStatusCell({ status }) {
//   const normalizedStatus = status?.toLowerCase();
//   const getStatusClass = (status) => {
//     if (["confirmed", "low"].includes(status)) {
//       return styles.statusBlue;
//     } else if (
//       [
//         "completed",
//         "resolved",
//         "approved",
//         "active",
//         "unoccupied",
//         "on-site",
//         "open",
//         "in-progress",
//         "accepted",
//         "delivery",
//       ].includes(status)
//     ) {
//       return styles.statusGreen;
//     } else if (
//       ["escalated", "urgent", "in progress", "inactive", "rejected"].includes(
//         status
//       )
//     ) {
//       return styles.statusRed;
//     } else if (
//       [
//         "pending",
//         "under review",
//         "medium",
//         "maintenance",
//         "occupied",
//         "under-review",
//         "pickup",
//       ].includes(status)
//     ) {
//       return styles.statusOrange;
//     } else if (["pickup-delivery"]) {
//       return styles.statusBlue;
//     } else {
//       return styles.statusDefault;
//     }
//   };
//   const statusClass = getStatusClass(normalizedStatus);
//   return (
//     <div className={mergeClass(statusClass, styles.statusCell)}>
//       <span />
//       <p>{capitalizeEachWord(status || "")}</p>
//     </div>
//   );
// }

export function RenderStatusCell({ status }) {
  const locale = useLocale();
  const normalizedStatus = status?.toLowerCase();

  const getStatusClass = (status) => {
    if (["confirmed", "low", "pickup-delivery"].includes(status)) {
      return styles.statusBlue;
    } else if (
      [
        "completed",
        "resolved",
        "approved",
        "active",
        "unoccupied",
        "on-site",
        "open",
        "accepted",
        "delivery",
      ].includes(status)
    ) {
      return styles.statusGreen;
    } else if (
      [
        "escalated",
        "urgent",
        "inactive",
        "rejected",
        "high",
        "occupied",
        "cancelled",
      ].includes(status)
    ) {
      return styles.statusRed;
    } else if (["partially-occupied"].includes(status)) {
      return styles.statusYellow;
    } else if (
      [
        "in-progress",
        "in progress",
        "pending",
        "under review",
        "medium",
        "maintenance",
        "under-review",
        "pickup",
        "off-site",
      ].includes(status)
    ) {
      return styles.statusOrange;
    } else {
      return styles.statusDefault;
    }
  };

  const statusClass = getStatusClass(normalizedStatus);

  // Fallback: if translation not available, show raw status
  const translatedStatus =
    statusTranslations[locale]?.[normalizedStatus] || status;

  return (
    <div className={mergeClass(statusClass, styles.statusCell)}>
      <span />
      <p>{capitalizeEachWord(translatedStatus)}</p>
    </div>
  );
}

export function RenderMultiLangCell({ item }) {
  const locale = useLocale();
  // If item is a string and matches house/room/apartment, use statusTranslations
  if (
    typeof item === "string" &&
    ["house", "room", "apartment"].includes(item)
  ) {
    return (
      <div className={styles.multiLangCell}>
        <p>
          {statusTranslations[locale]?.[item] ||
            statusTranslations["en"]?.[item] ||
            item}
        </p>
      </div>
    );
  }
  // Otherwise, assume item is an object with language keys
  return (
    <div className={styles.multiLangCell}>
      <p>{item?.[locale] || item?.en || "NA"}</p>
    </div>
  );
}

export function RenderDateTimeCell({ dateTime, withoutTimezone = false }) {
  const formatDateTime = () => {
    if (withoutTimezone) {
      // Show as UTC without timezone offset
      return moment.utc(dateTime).format("YYYY-MM-DD • h:mmA");
    } else {
      // Show with timezone offset (local time)
      return moment(dateTime).format("YYYY-MM-DD • h:mmA");
    }
  };

  return (
    <div className={styles.dateTimeCell}>
      <p>{formatDateTime()}</p>
    </div>
  );
}

export function RenderSwitchCell({
  isActive,
  onChange = () => {},
  disabled = false,
}) {
  const handleChange = (e) => {
    e.stopPropagation(); // stop the row click
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const locale = useLocale();
  const activeLabel = statusTranslations[locale]?.active || "Active";
  const inactiveLabel = statusTranslations[locale]?.inactive || "Inactive";
  return (
    <div
      className={styles.switchCell}
      data-switch-cell=""
      onClick={(e) => e.stopPropagation()} // stop modal from opening when clicking anywhere in the switch cell
    >
      <Form.Switch
        checked={isActive}
        onChange={handleChange}
        className={styles.switch}
        disabled={disabled}
      />
      <p>{isActive ? activeLabel : inactiveLabel}</p>
    </div>
  );
}

export function RenderPhoneNumberCell({ callingCode, phoneNumber }) {
  return (
    <div className={styles.phoneNumberCell}>
      <p>
        ({callingCode}) {phoneNumber}
      </p>
    </div>
  );
}

export function RenderItemPhotoCell({ photo, itemName = "" }) {
  return (
    <div className={styles.itemPhotoCell}>
      <Image
        src={imageUrl(photo, "/app-images/image-placeholder.png")}
        alt={itemName}
        width={40}
        height={40}
      />
      <p>{capitalizeEachWord(itemName)}</p>
    </div>
  );
}
