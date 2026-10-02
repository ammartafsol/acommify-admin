"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AddEditBusModal from "@/components/organisms/Modals/AddEditBusModal/AddEditBusModal";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { capitalizeEachWord, mergeClass } from "@/resources/utils/helper";
import { BusManagementTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { ReactSVG } from "react-svg";
import classes from "./styles.module.css";

import { useSelector } from "react-redux";
export default function BusManagementTemplate() {
  const t = useTranslations("busManagementPage");
  const { permissions } = useSelector((state) => state.authReducer);
  const locale = useLocale();
  const { Get, Patch } = useAxios();
  const filterOptions = [
    {
      label: t("filterStatus.options.0.label"),
      value: "all",
    },
    {
      label: t("filterStatus.options.1.label"),
      value: "active",
    },
    {
      label: t("filterStatus.options.2.label"),
      value: "inactive",
    },
  ];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(filterOptions[0]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const filterRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState("");
  const searchDebounce = useDebounce(search, 500);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);

  const tableActions = [
    {
      renderItem: ({ data }) => {
        const menuItems = [
          {
            title:
              data.status === "active"
                ? t("busStatus.inactive")
                : t("busStatus.active"),
            onClick: () => {
              const newStatus =
                data.status === "active" ? "inactive" : "active";
              handleStatusChange(data.slug, newStatus);
            },
            style: {
              color: "var(--Black)",
              fontWeight: 500,
            },
          },
        ];

        return (
          <div className={classes.actionsMain}>
            <div
              className={classes.tableIcon}
              onClick={() => {
                setRowData(data);
                setShowDetailModal(true);
              }}
            >
              <ReactSVG src="/svg/eye.svg" />
            </div>
            <div
              className={classes.tableIcon}
              onClick={() => {
                setRowData(data);
                setShowModal(true);
              }}
            >
              <ReactSVG src="/svg/edit.svg" />
            </div>
            <div
              className={classes.tableIcon}
              onClick={() => {
                setRowData(data);
                setShowAreYouSureModal(true);
              }}
            >
              <ReactSVG src="/svg/delete.svg" />
            </div>

            <MenuComponent
              portal
              items={menuItems}
              menuButton={
                <TbDotsVertical
                  color="#B2B5BA"
                  onClick={(e) => e.stopPropagation()}
                  className="pointer"
                  size={20}
                />
              }
              value={data?._id}
            />
          </div>
        );
      },
    },
  ];

  const fetchBusData = async ({ search, filter, page }) => {
    setLoading("loading");
    const query = {
      search,
      status: filter,
      page,
      limit: RECORDS_LIMIT,
    };
    const params = new URLSearchParams(query).toString();
    const { response } = await Get({
      route: `admin/bus/all?${params}`,
    });
    if (response) {
      const formattedData = response?.data?.map((bus) => ({
        ...bus,
        busId: bus?.busNumber || "N/A",
        busName: bus?.name?.[locale] || "N/A",
        startLocation: bus.startingPointAddress?.[locale] || "N/A",
        endLocation: bus.endingPointAddress?.[locale] || "N/A",
        capacity: bus?.capacity || "N/A",
        status: bus?.status || "N/A",
        startTime:
          moment(bus?.schedule?.startTime, "HH:mm").format("hh:mm A") || "N/A",
        endTime:
          moment(bus?.schedule?.endTime, "HH:mm").format("hh:mm A") || "N/A",
        availableDates: bus?.schedule?.availableDates
          ? (() => {
              const formattedDates = bus.schedule.availableDates
                .map((date) => moment(date).format("DD-MM-YY"))
                .join(", ");
              return formattedDates.length > 19
                ? formattedDates.substring(0, 18) + "..."
                : formattedDates;
            })()
          : "N/A",
      }));
      setTableData(formattedData);
      setTotalRecords(response.totalRecords);
    }
    setLoading("");
  };

  const deleteBusHandler = async (busId) => {
    setLoading("loading");
    const { response } = await Patch({
      route: `admin/bus/update/${busId}`,
      data: {
        status: "deleted",
      },
    });
    if (response) {
      await fetchBusData({
        search: searchDebounce,
        filter: filter.value,
        page,
      });
      RenderToast({
        type: "success",
        message: t("deletedBus"),
      });
    }
    setLoading("");
  };
  // occupancyStatus, userType
  // query mein is sy filter hojayega
  // noOfBedsStart, noOfBedsEnd (range)
  const handleStatusChange = async (busId, newStatus) => {
    setLoading("loading");
    const { response } = await Patch({
      route: `admin/bus/update/${busId}`,
      data: { status: newStatus },
    });
    if (response) {
      await fetchBusData({
        search: searchDebounce,
        filter: filter.value,
        page,
      });
      RenderToast({
        type: "success",
        message: t("statusUpdated"),
      });
    }
    setLoading("");
  };

  useEffect(() => {
    fetchBusData({ search: searchDebounce, filter: filter.value, page });
  }, [searchDebounce, filter, page]);
  return (
    <Container className={mergeClass("containerFluid", classes.main)}>
      <SubHeader
        title={t("title")}
        showSearchAndFilter
        searchAndFilterAtTop
        // showBackBtn
        searchProps={{
          search: search,
          setSearch: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        filterProps={{
          filterOptions,
          filterValue: filter,
          setFilterValue: setFilter,
          filterOpen,
          setFilterOpen,
          filterRef,
        }}
        buttonProps={
          permissions.includes("add-edit-bus")
            ? {
                label: t("addBus"),
                variant: "primary",
                onClick: () => {
                  setShowModal(true);
                  setRowData(null);
                },
                leftIcon: (
                  <ReactSVG
                    beforeInjection={(svg) => {
                      svg.setAttribute("width", "24px");
                      svg.setAttribute("height", "24px");
                    }}
                    src="/svg/plus.svg"
                    className="reactSvg"
                  />
                ),
              }
            : undefined
        }
      />
      <AppTable
        tableHeader={BusManagementTableHeader(t)}
        actions={permissions.includes("add-edit-bus") ? tableActions : []}
        actionStyles={{
          width: "11%",
        }}
        data={tableData}
        tableMinWidth="1500px"
        pagination
        loading={loading}
        totalRecords={totalRecords}
        page={page}
        onRowClick={(data) => {
          setRowData(data);
          setShowDetailModal(true);
        }}
        onPageChange={(p) => {
          setPage(p);
          fetchBusData({
            page: p,
            search: searchDebounce,
            filter: filter.value,
          });
        }}
      />
      <AddEditBusModal
        show={showModal}
        setShow={setShowModal}
        title={t("addNewBus")}
        data={rowData}
        onSave={() => {
          fetchBusData({ search: searchDebounce, filter: filter.value, page });
        }}
      />
      <DetailModal
        show={showDetailModal}
        setShow={setShowDetailModal}
        data={rowData}
        title={t("busDetail")}
      >
        <div className={classes.modalMain}>
          <div className={classes.item}>
            <p>{t("table.busId")}</p>
            <p>{capitalizeEachWord(rowData?.busId) ?? "NA"}</p>
          </div>
          <div className={classes.item}>
            <p>{t("table.busName")}</p>
            <p>{capitalizeEachWord(rowData?.busName) ?? "NA"}</p>
          </div>
          <div className={classes.item}>
            <p>{t("table.startLocation")}</p>
            <p>{capitalizeEachWord(rowData?.startLocation) ?? "NA"}</p>
          </div>
          <div className={classes.item}>
            <p>{t("table.endLocation")}</p>
            <p>{capitalizeEachWord(rowData?.endLocation) ?? "NA"}</p>
          </div>
          <div className={classes.item}>
            <p>{t("table.capacity")}</p>
            <p>{rowData?.capacity ?? "NA"} </p>
          </div>
          <div className={classes.item}>
            <p>{t("table.status")}</p>
            <RenderStatusCell status={rowData?.status ?? "NA"} />
          </div>
          <div className={classes.item}>
            <p>{t("table.startTime")}</p>
            <p>{rowData?.startTime ?? "NA"}</p>
          </div>
          <div className={classes.item}>
            <p>{t("table.endTime")}</p>
            <p>{rowData?.endTime ?? "NA"}</p>
          </div>
          <div className={classes.item}>
            <p>{t("table.availableDates")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {rowData?.availableDates && rowData?.availableDates !== "N/A" ? (
                rowData.availableDates.split(", ").map((date, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      border: "1px solid #ddd",
                    }}
                  >
                    {date}
                  </span>
                ))
              ) : (
                <p>NA</p>
              )}
            </div>
          </div>
          <div className={classes.item}>
            <p>{t("table.description")}</p>
            <p>{rowData?.description?.[locale]}</p>
          </div>
        </div>
      </DetailModal>

      {showAreYouSureModal && (
        <AreYouSureModal
          show={showAreYouSureModal}
          setShow={setShowAreYouSureModal}
          onConfirm={() => {
            deleteBusHandler(rowData?.slug);
            setShowAreYouSureModal(false);
          }}
          loading={loading}
        />
      )}
    </Container>
  );
}
