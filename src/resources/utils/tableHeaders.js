import {
  RenderDateTimeCell,
  RenderItemPhotoCell,
  RenderMultiLangCell,
  RenderPhoneNumberCell,
  RenderStatusCell,
} from "@/components/organisms/AppTable/tableHelper";
import moment from "moment-timezone";
import { capitalizeEachWord, getAgeFromDOB, imageUrl } from "./helper";

export function DocumentsTableHeader(t, locale) {
  return [
    {
      key: "name",
      title: t("table.documentName"),
      style: { width: "25%" },
      renderItem: ({ data }) => (
        <p className="capitalize">{data?.name?.[locale] || "NA"}</p>
      ),
    },
    {
      key: "documentType",
      title: t("table.documentType"),
      style: { width: "20%" },
      renderItem: ({ data }) => (
        <p className="capitalize">
          {t(`table.${data?.documentType}`) || data?.documentType || "NA"}
        </p>
      ),
    },
    {
      key: "document",
      title: t("table.document"),
      style: { width: "15%" },
      renderItem: ({ item }) =>
        item ? (
          <a
            style={{
              color: "var(--Blue)",
              textDecoration: "underline",
            }}
            href={imageUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("table.viewDocument")}
          </a>
        ) : (
          <span className="text-muted">NA</span>
        ),
    },
    {
      key: "createdAt",
      title: t("table.createdAt"),
      style: { width: "18%" },
      renderItem: ({ item }) => <RenderDateTimeCell dateTime={item} />,
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "12%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
  ];
}

export function StaffsTableHeader(t, locale) {
  return [
    {
      key: "userId",
      title: t("table.staffID"),
      style: { width: "18%" },
    },
    {
      key: "fullName",
      title: t("table.name"),
      style: { width: "16%" },
      renderItem: ({ item }) => (
        <p className="capitalize">{item?.[locale] || "NA"}</p>
      ),
    },
    { key: "email", title: t("table.email"), style: { width: "18%" } },
    {
      key: "phone",
      title: t("table.phone"),
      style: { width: "20%" },
      renderItem: ({ data }) => (
        <RenderPhoneNumberCell
          callingCode={data.callingCode}
          phoneNumber={data.phoneNumber}
        />
      ),
    },
  ];
  // console.log(fullName, "fullName");
}

export function ResidentsTableHeader(t, locale, onRoomClick) {
  return [
    {
      key: "fullName",
      title: t("table.residentName"),
      style: { width: "11%" },
      renderItem: ({ data }) => (
        <p className="capitalize">{data?.fullName?.[locale] || "NA"}</p>
      ),
    },
    // {
    //   key: "accommodation",
    //   title: t("modal.roomNumber"),
    //   style: { width: "10%" },
    //   renderItem: ({ data }) => (
    //     <p className="capitalize">
    //       {data?.accommodation?.accommodationNumber || "N/A"}
    //     </p>
    //   ),
    // },
    // {
    //   key: "noOfBeds",
    //   title: t("modal.noOfBeds"),
    //   style: { width: "10%" },
    // },
    { key: "email", title: t("table.email"), style: { width: "18%" } },
    {
      key: "phoneNumber",
      title: t("table.phone"),
      style: { width: "11%" },

      renderItem: ({ data }) => (
        <RenderPhoneNumberCell
          callingCode={data.callingCode}
          phoneNumber={data.phoneNumber}
        />
      ),
    },
    {
      key: "accommodationNumber",
      title: t("table.roomNo"),
      style: { width: "11%" },
      renderItem: ({ data }) => {
        const roomNumber = capitalizeEachWord(
          data?.accommodation?.accommodationNumber || "N/A",
        );
        if (!onRoomClick) return roomNumber;
        return (
          <button
            type="button"
            className="roomNumberLink"
            onClick={(e) => {
              e.stopPropagation();
              onRoomClick(data);
            }}
          >
            {roomNumber}
          </button>
        );
      },
    },

    {
      key: "residentStatus",
      title: t("table.residentStatus"),
      style: { width: "11%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
    {
      key: "dateOfArrival",
      title: t("table.arrivalDate"),
      style: { width: "11%" },
      renderItem: ({ data }) => {
        return data?.dateOfArrival
          ? moment(data?.dateOfArrival).format("DD MMM, YYYY")
          : "N/A";
      },
    },
    {
      key: "dob",
      title: t("table.dob"),
      style: { width: "11%" },
      renderItem: ({ data }) => {
        return data?.familyMembers[0]?.dob
          ? moment(data?.familyMembers[0]?.dob).format("DD MMM, YYYY")
          : "N/A";
      },
    },
    {
      key: "age",
      title: t("table.age"),
      style: { width: "11%" },
      renderItem: ({ data }) =>
        getAgeFromDOB(data?.familyMembers[0]?.dob) || "N/A",
    },
  ];
}

export const FoodTokensTableHeader = (t) => [
  {
    key: "residentName",
    title: t("table.residentName"),
    style: { width: "18%", textTransform: "capitalize" },
  },
  {
    key: "roomNo",
    title: t("table.roomNo"),
    style: { width: "16%", textTransform: "capitalize" },
  },
  {
    key: "email",
    title: t("table.email"),
    style: { width: "18%", textTransform: "lowercase" },
  },
  {
    key: "phone",
    title: t("table.phone"),
    style: { width: "20%" },
    renderItem: ({ data }) => (
      <RenderPhoneNumberCell
        callingCode={data.callingCode}
        phoneNumber={data.phoneNumber}
      />
    ),
  },
  {
    key: "availableToken",
    title: t("table.availableToken"),
    style: { width: "16%" },
    renderItem: ({ data }) => {
      const value = Number(data.availableToken);
      return isNaN(value) ? "—" : value.toLocaleString();
    },
  },
];

export const IncidentReportsTableHeader = (t, locale) => [
  {
    key: "incidentId",
    title: t("table.incidentId"),
    style: { width: "8%" },
  },
  {
    key: "title",
    title: t("table.title"),
    style: { width: "12%", textTransform: "capitalize" },
    renderItem: ({ data }) => data?.title?.[locale] || "NA",
  },
  {
    key: "description",
    title: t("table.description"),
    style: { width: "15%", textTransform: "capitalize" },
    renderItem: ({ data }) => data?.description?.[locale] || "NA",
  },
  {
    key: "residentInvolved",
    title: t("table.residentInvolved"),
    style: { width: "10%", textTransform: "capitalize" },
    renderItem: ({ data }) =>
      data?.residentInvolved?.fullName?.[locale] || "NA",
  },
  {
    key: "assignedTo",
    title: t("table.reportedBy"),
    style: { width: "10%", textTransform: "capitalize" },
    renderItem: ({ data }) => data?.assignedTo?.fullName?.[locale] || "NA",
  },
  {
    key: "address",
    title: t("table.location"),
    style: { width: "7%", textTransform: "capitalize" },
    renderItem: ({ data }) => {
      return data?.address?.[locale] || "NA";
    },
  },
  {
    key: "severity",
    title: t("table.severity"),
    style: { width: "6%", textTransform: "capitalize" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
  {
    key: "createdAt",
    title: t("table.dateTime"),
    style: { width: "12%" },
    renderItem: ({ data }) => {
      return data?.createdAt
        ? moment(data?.createdAt).format("DD MMM, YYYY • h:mm A")
        : "NA";
    },
  },
  {
    key: "status",
    title: t("table.status"),
    style: { width: "8%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
  {
    key: "completedDate",
    title: t("table.completedDate"),
    style: { width: "10%" },
    renderItem: ({ data }) =>
      data?.completedDate && data?.status === "resolved"
        ? moment(data?.completedDate).format("DD MMM, YYYY • h:mm A")
        : "-",
  },
];

export const ManageItemsTableHeader = (t) => [
  {
    key: "image",
    title: t("table.itemName"),
    style: { width: "30%" },
    renderItem: ({ data }) => (
      <RenderItemPhotoCell photo={data.image} itemName={data.itemName} />
    ),
  },
  {
    key: "category",
    title: t("table.category"),
    style: { width: "12%" },
    renderItem: ({ data }) => (
      <p className="capitalize">{data.category || "NA"}</p>
    ),
  },
  {
    key: "shippingOption",
    title: t("table.shippingOptions"),
    style: { width: "14%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
  {
    key: "stock",
    title: t("table.stock"),
    style: { width: "11%" },
  },
  {
    key: "points",
    title: t("table.points"),
    style: { width: "11%" },
  },
  {
    key: "createdAt",
    title: t("table.dateAdded"),
    style: { width: "10%" },
    renderItem: ({ data }) =>
      moment(data?.createdAt).format("DD MMM, YYYY") || "",
  },
];

export const FAQsTableHeader = (t, locale) => {
  return [
    {
      key: "title",
      title: t("questionTitle"),
      style: { width: "35%" },
      renderItem: ({ data }) => {
        return data?.length > 20
          ? `${data?.slice(0, 20)}...`
          : data?.title?.[locale] || "NA";
      },
    },
    {
      key: "description",
      title: t("answerTitle"),
      style: { width: "40%" },
      renderItem: ({ data }) => {
        return data?.length > 20
          ? `${data?.slice(0, 20)}...`
          : data?.description?.[locale] || "NA";
      },
    },
    {
      key: "status",
      title: t("statusTitle"),
      style: { width: "15%" },
      renderItem: ({ data }) => <RenderStatusCell status={data.status} />,
    },
  ];
};

export const PositionsTableHeader = (t, locale) => {
  return [
    {
      key: "name",
      title: t("table.name"),
      style: { width: "25%" },
      renderItem: ({ data }) => {
        console.log(data?.name, "data.name");
        return data?.name?.[locale]?.length > 20
          ? `${data?.name?.[locale].slice(0, 20)}...`
          : data?.name?.[locale] || "NA";
      },
    },

    {
      key: "status",
      title: t("table.statusTitle"),
      style: { width: "10%" },
      renderItem: ({ data }) => <RenderStatusCell status={data.status} />,
    },
  ];
};

export function BusinessAdminTableHeader(t, locale) {
  return [
    {
      key: "centreName",
      title: t("table.centreName"),
      style: { width: "18%" },
      renderItem: ({ data }) => {
        return data?.centreName?.[locale] || "NA";
      },
    },
    {
      key: "country",
      title: t("table.country"),
      style: { width: "14%" },
      renderItem: ({ data }) => {
        return data?.country || "NA";
      },
    },
    {
      key: "fullName",
      title: t("table.name"),
      style: { width: "18%" },
      renderItem: ({ data }) => {
        const name = data?.fullName?.[locale] || data?.name?.[locale];
        return name?.length > 30 ? `${name.slice(0, 30)}...` : name || "NA";
      },
    },
    {
      key: "email",
      title: t("table.email"),
      style: { width: "18%" },
      renderItem: ({ data }) => data?.email || "NA",
    },
    {
      key: "phone",
      title: t("table.phone"),
      style: { width: "12%" },
      renderItem: ({ data }) => (
        <RenderPhoneNumberCell
          callingCode={data?.callingCode}
          phoneNumber={data?.phoneNumber}
        />
      ),
    },
    {
      key: "status",
      title: t("table.statusTitle"),
      style: { width: "10%" },
      renderItem: ({ data }) => <RenderStatusCell status={data?.status} />,
    },
  ];
}

export function NationwideDashboardTableHeader(t, locale) {
  return [
    {
      key: "fullName",
      title: t("table.fullName"),
      style: { width: "18%" },
      renderItem: ({ data }) => {
        const name = data?.fullName?.[locale] || data?.name?.[locale];
        return name?.length > 30 ? `${name.slice(0, 30)}...` : name || "NA";
      },
    },

    {
      key: "country",
      title: t("table.country"),
      style: { width: "14%" },
      renderItem: ({ data }) => {
        return data?.country || "NA";
      },
    },

    {
      key: "email",
      title: t("table.email"),
      style: { width: "18%" },
      renderItem: ({ data }) => data?.email || "NA",
    },
    {
      key: "phone",
      title: t("table.phone"),
      style: { width: "12%" },
      renderItem: ({ data }) => (
        <RenderPhoneNumberCell
          callingCode={data?.callingCode}
          phoneNumber={data?.phoneNumber}
        />
      ),
    },
    {
      key: "status",
      title: t("table.statusTitle"),
      style: { width: "10%" },
      renderItem: ({ data }) => <RenderStatusCell status={data?.status} />,
    },
  ];
}

export const ConfigurationTableHeader = (t, locale) => {
  return [
    {
      key: "name",
      title: t("table.name"),
      style: { width: "50%" },
      renderItem: ({ data }) => (
        <p className="capitalize">{data.name?.[locale] || "NA"}</p>
      ),
    },

    {
      key: "ip",
      title: t("table.ipAddress"),
      style: { width: "40%" },
      // renderItem: ({ data }) => <p className="capitalize">{data.ip || "NA"}</p>,
    },
  ];
};

export const CategoriesTableHeader = (locale, t) => [
  {
    key: "name",
    title: t("categoriesTable.categoryName"),
    style: { width: "55%" },
    renderItem: ({ data }) => (
      <p className="capitalize">{data?.name?.[locale] || ""}</p>
    ),
  },
  {
    key: "createdAt",
    title: t("categoriesTable.dateAdded"),
    style: { width: "25%" },
    renderItem: ({ data }) =>
      moment(data?.createdAt).format("DD MMM, YYYY") || "",
  },
];

export function LaundryBookingTableHeader(t, locale) {
  return [
    {
      key: "user",
      title: t("table.residentName"),
      style: { width: "15%" },
      renderItem: ({ item }) =>
        capitalizeEachWord(item?.fullName?.[locale] || ""),
    },
    {
      key: "user",
      title: t("table.roomNumber"),
      style: { width: "10%" },
      renderItem: ({ item }) =>
        capitalizeEachWord(item?.accommodation?.accommodationNumber || ""),
    },
    {
      key: "machine",
      title: t("table.machineName"),
      style: { width: "15%" },
      renderItem: ({ item }) => capitalizeEachWord(item?.name?.[locale] || ""),
    },
    {
      key: "laundryDateTime",
      title: t("table.laundryDateTime"),
      style: { width: "25%" },
      renderItem: ({ data }) =>
        moment(data?.bookingStartDate).format("DD MMM, YYYY • HH:mm A") +
          moment(data?.bookingEndDate).format(" - HH:mm A") || "",
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "20%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
  ];
}

export function AppointmentsTableHeader(t, locale) {
  return [
    {
      key: `user`,
      title: t("table.residentName"),
      style: { width: "15%" },
      renderItem: ({ item }) =>
        capitalizeEachWord(item?.fullName?.[locale] ?? "NA"),
    },
    {
      key: "user",
      title: t("table.roomNumber"),
      style: { width: "10%" },
      renderItem: ({ item }) =>
        capitalizeEachWord(item?.accommodation?.accommodationNumber || "NA"),
    },
    {
      key: "bookingStartDate",
      title: t("table.dateAndTime"),
      style: { width: "20%" },
      renderItem: ({ item }) => <RenderDateTimeCell dateTime={item} />,
    },
    {
      key: "serviceType",
      title: t("table.appointmentType"),
      style: { width: "15%", textTransform: "capitalize" },
    },
    {
      key: "reasonForMeeting",
      title: t("table.purpose"),
      style: { width: "20%", textTransform: "capitalize" },
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "13%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
  ];
}

export function BusBookingsTableHeader(t, locale) {
  return [
    {
      key: "user",
      title: t("table.residentName"),
      style: { width: "20%", textTransform: "capitalize" },
      renderItem: ({ item }) =>
        capitalizeEachWord(item?.fullName?.[locale] || "N/A"),
    },
    {
      key: "user",
      title: t("table.roomNumber"),
      style: { width: "16%" },
      renderItem: ({ item }) =>
        capitalizeEachWord(item?.accommodation?.accommodationNumber || "N/A"),
    },
    {
      key: "bus",
      title: t("table.busRoute"),
      style: { width: "20%" },
      renderItem: ({ item }) =>
        capitalizeEachWord(
          `${item?.startingPointAddress?.[locale]} - ${item?.endingPointAddress?.[locale]}` ||
            "N/A",
        ),
    },
    {
      key: "bookingStartDate",
      title: t("table.DepartureDateAndTime"),
      style: { width: "22%" },
      renderItem: ({ item }) =>
        moment(item).format("DD MMM, YYYY • HH:mm A") || "N/A",
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "12%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
  ];
}

export function BusBookingDetailTableHeader(t) {
  return [
    {
      key: "seatNumber",
      title: t("table.seatNumber") || "Seat Number",
      style: { width: "20%" },
      renderItem: ({ data }) => data?.seat?.seatNumber ?? "N/A",
    },
    {
      key: "passengerName",
      title: t("table.residentName") || "Resident Name",
      style: { width: "30%" },
      renderItem: ({ data }) =>
        capitalizeEachWord(data?.passengerName ?? "N/A"),
    },
    {
      key: "seatStatus",
      title: t("table.status") || "Status",
      style: { width: "20%" },

      renderItem: ({ data }) => (
        <RenderStatusCell status={data?.seat?.status} />
      ),
    },
    {
      key: "busId",
      title: t("table.busNumber") || "Bus Number",
      style: { width: "30%" },
      renderItem: ({ data }) =>
        capitalizeEachWord(data?.seat?.bus?.busNumber ?? "N/A"),
    },
  ];
}

export function MaintenanceRequestsTableHeader(t) {
  return [
    {
      key: "residentName",
      title: t("table.residentName"),
      style: { width: "18%" },
      renderItem: ({ data }) => capitalizeEachWord(data?.residentName || "NA"),
    },
    {
      key: "roomNumber",
      title: t("table.roomNumber"),
      style: { width: "11%" },
      renderItem: ({ data }) => capitalizeEachWord(data?.roomNumber || "NA"),
    },
    {
      key: "requestDateTime",
      title: t("table.requestDateTime"),
      style: { width: "15%" },
    },
    {
      key: "issueCategory",
      title: t("table.issueCategory"),
      style: { width: "15%" },
      renderItem: ({ data }) => capitalizeEachWord(data?.issueCategory || "NA"),
    },
    {
      key: "shortDescription",
      title: t("table.shortDescription"),
      style: { width: "20%" },
      renderItem: ({ data }) =>
        capitalizeEachWord(data?.shortDescription || "NA"),
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "11%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
  ];
}

export function VisitorBookingTableHeader(t, locale) {
  return [
    {
      key: "data",
      title: t("table.residentName"),
      style: { width: "20%", textTransform: "capitalize" },
      renderItem: ({ data }) => data?.user?.fullName?.[locale] || "",
    },
    {
      key: "visitorName",
      title: t("table.visitorName"),
      style: { width: "20%", textTransform: "capitalize" },
    },
    {
      key: "additionalNotes",
      title: t("table.additionalNotes"),
      style: { width: "20%", textTransform: "capitalize" },
    },

    {
      key: "bookingStartDate",
      title: t("table.dateAndTime"),
      style: { width: "30%" },
      renderItem: ({ data }) =>
        moment(data?.bookingStartDate).format("DD MMM, YYYY • HH:mm A") +
          " - " +
          moment(data?.bookingEndDate).format("HH:mm A") || "",
    },
  ];
}

export function BusManagementTableHeader(t) {
  return [
    {
      key: "busId",
      title: t("table.busId"),
      style: { width: "7%", textTransform: "capitalize" },
    },
    {
      key: "busName",
      title: t("table.busName"),
      style: { width: "10%", textTransform: "capitalize" },
    },
    {
      key: "startLocation",
      title: t("table.startLocation"),
      style: { width: "11%", textTransform: "capitalize" },
    },
    {
      key: "endLocation",
      title: t("table.endLocation"),
      style: { width: "11%", textTransform: "capitalize" },
    },

    {
      key: "capacity",
      title: t("table.capacity"),
      style: { width: "8%" },
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "9%" },
      renderItem: ({ item }) => <RenderStatusCell status={item} />,
    },
    {
      key: "startTime",
      title: t("table.startTime"),
      style: { width: "11%" },
    },
    {
      key: "endTime",
      title: t("table.endTime"),
      style: { width: "11%" },
    },
    {
      key: "availableDates",
      title: t("table.availableDates"),
      style: { width: "11%" },
    },
  ];
}

export const RoomsHousesTableHeader = (t) => [
  {
    key: "accommodationNumber",
    title: t("table.houseRoomNumber"),
    style: { width: "20%" },
    renderItem: ({ data }) => capitalizeEachWord(data?.accommodationNumber),
  },

  {
    key: "noOfBeds",
    title: t("table.numberOfBeds"),
    style: { width: "15%" },
  },

  {
    key: "noOfBeds",
    title: t("table.bedsOccupied"),
    style: { width: "15%" },
    renderItem: ({ data }) => {
      const totalBeds = data?.noOfBeds;
      const remainingBeds = data?.remainingBeds;

      // If total beds is not present, show N/A
      if (totalBeds === undefined || totalBeds === null) {
        return "N/A";
      }

      // If remaining beds is not present, assume all beds are occupied
      if (remainingBeds === undefined || remainingBeds === null) {
        return `${totalBeds} / ${totalBeds}`;
      }

      // Calculate occupied beds
      const occupiedBeds = totalBeds - remainingBeds;
      return `${occupiedBeds} / ${totalBeds}`;
    },
  },

  {
    key: "type",
    title: t("table.accommodationType"),
    style: { width: "15%" },
    renderItem: ({ item }) => <RenderMultiLangCell item={item} />,
  },

  {
    key: "occupancyStatus",
    title: t("table.occupancyStatus"),
    style: { width: "15%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
  // {
  //   key: "status",
  //   title: t("table.status"),
  //   style: { width: "16%" },
  //   renderItem: ({ item }) => <RenderStatusCell status={item} />,
  // },
];

export const RoomsHousesVisitorTableHeader = (t) => [
  {
    key: "accommodationNumber",
    title: t("table.houseRoomNumber"),
    style: { width: "25%" },
    renderItem: ({ data }) => capitalizeEachWord(data?.accommodationNumber),
  },

  {
    key: "type",
    title: t("table.accommodationType"),
    style: { width: "25%" },
    renderItem: ({ item }) => <RenderMultiLangCell item={item} />,
  },
  {
    key: "occupancyStatus",
    title: t("table.occupancyStatus"),
    style: { width: "30%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
  // {
  //   key: "status",
  //   title: t("table.status"),
  //   style: { width: "16%" },
  //   renderItem: ({ item }) => <RenderStatusCell status={item} />,
  // },
];

export const MaintenanceCategoriesTableHeader = (t, locale) => [
  {
    key: "name",
    title: t("table.categoryName"),
    style: { width: "25%" },
    renderItem: ({ data }) => capitalizeEachWord(data.name?.[locale]),
  },
  {
    key: "severity",
    title: t("table.risk"),
    style: { width: "20%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
  {
    key: "status",
    title: t("table.status"),
    style: { width: "20%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
];

export const MachineCategoriesTableHeader = (t, locale) => [
  {
    key: "name",
    title: t("table.machineName"),
    style: { width: "25%" },
    renderItem: ({ data }) => capitalizeEachWord(data.name?.[locale] || ""),
  },

  {
    key: "status",
    title: t("table.status"),
    style: { width: "25%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
];

export const FoodTokensCrudTableHeader = (locale) => [
  {
    key: "totalTokens",
    title: "Total Tokens",
    style: { width: "25%" },
    renderItem: ({ data }) => data?.totalTokens?.toString() || "",
  },

  {
    key: "user",
    title: "User",
    style: { width: "25%" },
    renderItem: ({ data }) =>
      capitalizeEachWord(data?.user?.fullName?.[locale] || ""),
  },
];

export const OrdersManagementTableHeader = (t) => [
  {
    key: "orderId",
    title: t("table.orderId"),
    style: { width: "15%" },
  },
  {
    key: "customerName",
    title: t("table.customer"),
    style: { width: "20%" },
    renderItem: ({ data }) => capitalizeEachWord(data?.customerName || "NA"),
  },
  {
    key: "orderDate",
    title: t("table.date"),
    style: { width: "20%" },
  },
  {
    key: "totalPoints",
    title: t("table.total"),
    style: { width: "15%" },
  },
  {
    key: "status",
    title: t("table.status"),
    style: { width: "20%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
];

export const OrderDetailTableHeader = (t) => [
  {
    key: "index",
    title: "#",
    style: { width: "5%" },
  },
  {
    key: "productName",
    title: t("orderDetailsHeader.product"),
    style: { width: "20%" },
  },
  {
    key: "categoryName",
    title: t("orderDetailsHeader.category"),
    style: { width: "15%" },
    renderItem: ({ data }) => capitalizeEachWord(data?.categoryName || "NA"),
  },

  {
    key: "shippingOption",
    title: t("orderDetailsHeader.shippingType"),
    style: { width: "15%" },
    renderItem: ({ item }) => (
      <RenderStatusCell status={`${item}`.replace(/-/g, " / ")} />
    ),
  },
  {
    key: "quantity",
    title: t("orderDetailsHeader.quantity"),
    style: { width: "10%" },
  },
  {
    key: "totalPoints",
    title: t("orderDetailsHeader.totalPoints"),
    style: { width: "10%" },
  },
  {
    key: "status",
    title: t("orderDetailsHeader.status"),
    style: { width: "15%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
];

export const HelpLineCardsTableHeader = (t, locale) => [
  {
    key: "title",
    title: t("table.title"),
    style: { width: "20%", textTransform: "capitalize" },

    renderItem: ({ data }) => data?.title?.[locale] || "NA",
  },
  {
    key: "country",
    title: t("table.country"),
    style: { width: "15%" },
    renderItem: ({ data }) => data?.country?.[locale] || "NA",
  },
  {
    key: "description",
    title: t("table.description"),
    style: { width: "25%" },
    renderItem: ({ data }) => data?.description?.[locale] || "NA",
  },

  {
    key: "phoneNumber",
    title: t("table.phoneNumber"),
    style: { width: "15%" },
    renderItem: ({ data }) => (
      <RenderPhoneNumberCell
        callingCode={data.callingCode}
        phoneNumber={data.phoneNumber}
      />
    ),
  },
  {
    key: "status",
    title: t("table.status"),
    style: { width: "10%" },
    renderItem: ({ item }) => <RenderStatusCell status={item} />,
  },
];
