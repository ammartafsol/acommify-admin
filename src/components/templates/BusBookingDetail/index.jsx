"use client";
import React, { useEffect, useState } from "react";
import classes from "./styles.module.css";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { Container } from "react-bootstrap";
import TopHeader from "@/components/molecules/TopHeader/TopHeader";
import BusTimeDetailCard from "@/components/molecules/BusTimeDetailCard/BusTimeDetailCard";
import Image from "next/image";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { BusBookingDetailTableHeader } from "@/resources/utils/tableHeaders";
import { ReactSVG } from "react-svg";
import { busBookingsDetailsData } from "@/developmentContent/busBookingDetails";
import useDirection from "@/resources/hooks/useDirection";
import EditBusBookingModal from "@/components/organisms/Modals/EditBusBookingModal/EditBusBookingModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";

export default function BusBookingDetailTemplate({ slug }) {
  console.log(slug, "slug");
  const t = useTranslations("busBookingDetail");
  const dir = useDirection();
  const { Get } = useAxios();
  const busOptions = [
    {
      label: t("busBooking.dropdownOptions.greenBus"),
      value: "bus_1",
    },
    {
      label: t("busBooking.dropdownOptions.blueBus"),
      value: "bus_2",
    },
    {
      label: t("busBooking.dropdownOptions.redBus"),
      value: "bus_3",
    },
  ];

  const filterOptions = [
    {
      label: t("busBooking.filterOptions.all"),
      value: "all",
    },
    {
      label: t("busBooking.filterOptions.available"),
      value: "available",
    },
    {
      label: t("busBooking.filterOptions.booked"),
      value: "booked",
    },
    {
      label: t("busBooking.filterOptions.selected"),
      value: "selected",
    },
  ];
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0]);
  const [selectedBus, setSelectedBus] = useState(busOptions[0]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState("");
  const [page, setPage] = useState(1);
  const [editData, setEditData] = useState(null);
  const searchDebounce = useDebounce(search, 500);
  const [data, setData] = useState([]);
  // const [tableData, setTableData] = useState([]);
  // const tableActions = [
  //   {
  //     renderItem: ({ data }) => (
  //       <div className={classes.actionsMain}>
  //         <div
  //           className={classes.tableIcon}
  //           onClick={() => {
  //             setShowEditModal(true);
  //             setEditData(data);
  //           }}
  //         >
  //           <ReactSVG src="/svg/edit.svg" />
  //         </div>
  //         <div className={classes.tableIcon}>
  //           <ReactSVG src="/svg/delete.svg" />
  //         </div>
  //       </div>
  //     ),
  //   },
  // ];

  const getBusBookingTableData = async ({ slug }) => {
    setLoading("gettingTableData");
    const { response } = await Get({
      route: `admin/booking/detail/${slug}`,
    });
    if (response) {
      console.log("Full response:", response);
      console.log("Seats array:", response?.data?.seats);
      console.log("First seat item:", response?.data?.seats?.[0]);
      setData(response?.data);
    }
    setLoading("");
  };

  // const getBusBookingDetails = async ({ slug, searchDebounce, page }) => {
  //   const query = {
  //     search: searchDebounce,
  //     page: 1,
  //     limit: 10,
  //   };
  //   const queryString = new URLSearchParams(query).toString();
  //   setLoading("getting");
  //   const { response } = await Get({
  //     route: `admin/bus/detail/${slug}?${queryString}`,
  //   });
  //   if (response) {
  //     // setBusBookingDetailsData(response?.data);
  //     console.log(response, "responseresponseresponse");
  //     setData(response?.data);
  //   }
  //   setLoading("");
  // };

  useEffect(() => {
    // if (slug) getBusBookingDetails({ slug, searchDebounce, page: 1 });
    if (slug) getBusBookingTableData({ slug });
  }, [slug, searchDebounce]);

  return (
    <div className={classes.container}>
      <Container className="containerFluid">
        <TopHeader
          icon={
            <Image
              src="/svg/blueBus.svg"
              alt="Bus Icon"
              height={16}
              width={16}
            />
          }
          title={t("busBooking.title")}
          // search={search}
          // setSearch={(val) => {
          //   setSearch(val);
          //   setPage(1);
          // }}
          filterOptions={filterOptions}
          dropdownValue={selectedBus}
          setDropdownValue={setSelectedBus}
          dropdownOptions={busOptions}
          filterValue={selectedFilter}
          setFilterValue={setSelectedFilter}
          // showSearch
          direction={dir}
        />
        <div className={classes.busCardsContainer}>
          {/* {busCardsData?.map((bus, index) => (
            
          ))} */}
          <BusTimeDetailCard
            key={data?.id}
            bus={data}
            containerClass={classes.busCard}
            showStatus={false}
            t={(key) => t(`busDetailCard.${key}`)}
          />
        </div>

        <div className={classes.tableContainer}>
          <AppTable
            tableHeader={BusBookingDetailTableHeader(t)}
            // actions={tableActions}
            // actionStyles={{
            //   width: "10%",
            // }}
            data={data?.seats || []}
          />
        </div>
      </Container>
      {showEditModal && (
        <EditBusBookingModal
          show={showEditModal}
          setShow={setShowEditModal}
          data={editData}
          setData={setEditData}
          t={t}
        />
      )}
    </div>
  );
}

const busCardsData = [
  {
    id: 1,
    icon: "/svg/greenBus.svg",
    title: {
      en: "Green Bus",
      "en-GB": "Green Bus",
      es: "Autobús Verde",
      fr: "Bus Vert",
    },
    description: {
      en: "A convenient and eco-friendly bus service from Rathmore to Tesco.",
      "en-GB":
        "A reliable green bus service operating between Rathmore and Tesco.",
      es: "Un servicio de autobús ecológico y conveniente de Rathmore a Tesco.",
      fr: "Un service de bus écologique et pratique de Rathmore à Tesco.",
    },
    from: "Rathmore",
    to: "Tesco",
    startTime: "12:00 PM",
    endTime: "01:15 PM",
    date: "Feb 24, 2023",
    duration: "1h 15m",
    departureDate: "Nov 18, 2024, 8:00 AM",
    seatsAvailable: 15,
    totalSeats: 20,
    available: true,
    slug: "green-bus",
  },
];
