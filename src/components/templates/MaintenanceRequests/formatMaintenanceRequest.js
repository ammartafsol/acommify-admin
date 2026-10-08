import moment from "moment-timezone";

export function localizedValue(value, locale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.[locale] || value?.en || "";
}

export function formatMaintenanceRequest(item, locale) {
  if (!item) return null;

  return {
    ...item,
    residentName:
      localizedValue(item?.user?.fullName, locale) ||
      localizedValue(item?.residentName, locale) ||
      "N/A",
    roomNumber: item?.accommodation?.accommodationNumber || item?.roomNumber || "N/A",
    requestDateTime: item?.createdAt
      ? moment(item.createdAt).format("YYYY-MM-DD • h:mmA")
      : item?.requestDateTime || "N/A",
    issueCategory:
      localizedValue(item?.category?.name, locale) ||
      localizedValue(item?.issueCategory, locale) ||
      "N/A",
    shortDescription: item?.description || item?.shortDescription || "N/A",
    status: item?.status || "N/A",
  };
}

export function getHouseAndRoom(item) {
  const accommodation = item?.accommodation || {};
  const parent =
    accommodation.parent ||
    accommodation.house ||
    accommodation.parentAccommodation ||
    null;
  const number = accommodation.accommodationNumber || item?.roomNumber || "";
  const type = String(accommodation.type || "").toLowerCase();

  if (parent?.accommodationNumber) {
    return {
      house: parent.accommodationNumber,
      room: type === "house" ? "" : number,
    };
  }

  if (type === "house") {
    return {
      house: number,
      room: accommodation.room?.accommodationNumber || "",
    };
  }

  return { house: "", room: number };
}

export function getPriority(item) {
  const severity = String(
    item?.category?.severity || item?.severity || "",
  ).toLowerCase();

  if (["high", "urgent"].includes(severity)) return "high";
  if (severity === "medium") return "medium";
  if (severity === "low") return "low";
  return "";
}

export function getRequestCode(item) {
  const raw =
    item?.requestId || item?.ticketNumber || item?.referenceNumber || item?.code;

  if (raw) {
    const value = String(raw);
    return value.startsWith("#") ? value : `#${value}`;
  }

  if (item?.slug) {
    return `#${String(item.slug).slice(-5).toUpperCase()}`;
  }

  return "";
}

export function getDocumentSrc(doc) {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  return doc.url || doc.key || doc.path || "";
}

export function getDocumentKey(doc) {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  return doc.key || doc.url || doc.path || "";
}
