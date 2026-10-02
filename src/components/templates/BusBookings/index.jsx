"use client";
import Wrapper from "@/components/atoms/Wrapper/Wrapper";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import CalendarComponent from "@/components/organisms/Calender/Calender";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import { useRouter } from "@/i18n/navigation";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { capitalizeEachWord } from "@/resources/utils/helper";
import { BusBookingsTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { CiCalendar } from "react-icons/ci";
import { HiMenu } from "react-icons/hi";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import classes from "./styles.module.css";
import useDimensions from "@/resources/hooks/useDimensions";

const BusBookings = () => {
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("busBookings");
  const { Get, Post } = useAxios();
  const router = useRouter();
  const locale = useLocale();
  const { width } = useDimensions();
  const isMobile = width < 576;
  const tabsData = [
    { label: t("tabs.all"), value: "all", id: "all" },
    { label: t("tabs.pending"), value: "pending", id: "pending" },
    { label: t("tabs.accepted"), value: "accepted", id: "accepted" },
    { label: t("tabs.rejected"), value: "rejected", id: "rejected" },
    { label: t("tabs.cancelled"), value: "cancelled", id: "confirm" },
    { label: t("tabs.completed"), value: "completed", id: "completed" },
  ];

  const [activeIcon, setActiveIcon] = useState("menu");
  const [selectedTab, setSelectedTab] = useState(tabsData[0]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [dataCalender, setDataCalender] = useState([]);
  const [busData, setBusData] = useState([]);
  const [loading, setLoading] = useState({
    tableLoading: false,
    approveReject: false,
  });
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const tableActions = useMemo(
    () => [
      {
        renderItem: ({ data }) => (
          <div className={classes.actionsMain}>
            {data.status === "pending" && (
              <div
                className={classes.tableIcon}
                title={t("action.approve")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRowData(data);
                  setActionType("accept");
                  setShowAreYouSureModal(true);
                }}
              >
                <ReactSVG src="/svg/approved.svg" />
              </div>
            )}
            {data.status === "pending" && (
              <div
                className={classes.tableIcon}
                title={t("action.cancel")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRowData(data);
                  setActionType("reject");
                  setShowAreYouSureModal(true);
                }}
              >
                <ReactSVG src="/svg/close.svg" />
              </div>
            )}
            <div
              className={classes.tableIcon}
              title={t("action.view")}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRowData(data);
                setShowViewModal(true);
              }}
            >
              <ReactSVG src="/svg/eye.svg" />
            </div>
          </div>
        ),
      },
    ],
    [],
  );

  const fetchBusData = useCallback(
    async (currentPage = 1) => {
      setLoading({ ...loading, tableLoading: true });
      const isCalendarView = activeIcon === "calendar";
      const params = new URLSearchParams({
        serviceType: "bus",
        ...(!isCalendarView && {
          page: currentPage,
          limit: 10,
          // search: debounceSearch,
          status: selectedTab.value,
          ...(debounceSearch ? { search: debounceSearch } : {}),
        }),
        ...(isCalendarView && {
          startDate: moment(dateRange.start).format("YYYY-MM-DD"),
          endDate: moment(dateRange.end).format("YYYY-MM-DD"),
        }),
      });

      const { response } = await Get({
        route: `admin/booking/all?${params.toString()}`,
      });
      if (response?.status === "success") {
        if (isCalendarView) {
          setDataCalender(response.data);
        } else {
          setBusData(response.data);
          setTotalRecords(response.totalRecords);
        }
      }

      setLoading({ ...loading, tableLoading: false });
    },

    [debounceSearch, selectedTab, dateRange],
  );

  const handleRangeChange = (range) => {
    setDateRange({ start: range.start, end: range.end });
  };

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchBusData();
    }
  }, [dateRange]);

  // useEffect(() => {
  //   fetchBusData(page);
  // }, [debounceSearch, selectedTab, page]);
  useEffect(() => {
    console.log("DEBOUNCE VALUE :", debounceSearch);
    fetchBusData(page);
  }, [debounceSearch, selectedTab]);

  const events = useMemo(() => {
    return (
      dataCalender?.map((booking) => ({
        id: booking?.slug,
        title: `${booking?.user?.fullName?.[locale] || ""} - ${
          booking?.bus?.name?.[locale] || ""
        }`,
        start: moment(booking.bookingStartDate).format("YYYY-MM-DD"),
        end: moment(booking.bookingEndDate).format("YYYY-MM-DD"),
        status: booking?.status,
        resource: {
          ...booking,
        },
      })) || []
    );
  }, [dataCalender]);

  return (
    <div className={classes.container}>
      <Container className="containerFluid">
        <SubHeader
          title={t("title")}
          showBackBtn={isMobile ? true : false}
          tabsProps={{
            tabsData: activeIcon === "calendar" ? [] : tabsData,
            selected: selectedTab,
            setSelected: setSelectedTab,
          }}
          searchAndFilterAtTop
          showSearchAndFilter
          searchProps={{
            search,
            // setSearch: (value) => {
            //   setSearch(value);
            //   setPage(1);
            // },
            setSearch: (value) => {
              setSearch(value);
              // console.log("SEARCH VALUE ", value);
              setPage(1);
            },
          }}
        >
          <div className={classes.icons}>
            <div className={classes.icon} onClick={() => setActiveIcon("menu")}>
              <HiMenu
                size={18}
                color={activeIcon === "menu" ? "#000" : "#8C939B"}
              />
            </div>
            <div
              className={classes.icon}
              onClick={() => setActiveIcon("calendar")}
            >
              <CiCalendar
                size={18}
                color={activeIcon === "calendar" ? "#000" : "#8C939B"}
              />
            </div>
          </div>
        </SubHeader>

        <div className={classes.tableMain}>
          {activeIcon === "calendar" ? (
            <div className={classes.content}>
              <Wrapper
                active={loading.tableLoading}
                loading={loading.tableLoading}
                zIndex={1000}
                message={null}
              >
                <CalendarComponent
                  onRangeChange={handleRangeChange}
                  events={events || []}
                  onEventClick={(event) => {
                    setSelectedRowData(event?.resource);
                    setShowViewModal(true);
                  }}
                />
              </Wrapper>
            </div>
          ) : (
            <div className={classes.content}>
              <AppTable
                tableHeader={BusBookingsTableHeader(t, locale)}
                className="cursorPointer"
                data={busData}
                actions={tableActions}
                pagination
                page={page}
                totalRecords={totalRecords}
                onPageChange={(p) => {
                  setPage(p);
                  fetchBusData(p);
                }}
                actionStyles={{
                  width: "19%",
                }}
                loading={loading.tableLoading}
                onRowClick={(rowData) => {
                  console.log(rowData, "rowData");
                  router.push(
                    `/bus-booking/${rowData?.slug}?${moment(
                      rowData?.bookingStartDate,
                    ).format("YYYY-MM-DD")}`,
                  );
                }}
              />
            </div>
          )}
        </div>
      </Container>
      {/* AreYouSureModal for Accept/Reject */}
      {showAreYouSureModal && (
        <AreYouSureModal
          show={showAreYouSureModal}
          setShow={setShowAreYouSureModal}
          loading={loading.approveReject}
          title={
            actionType === "accept"
              ? t("areYouSureModal.approve")
              : t("areYouSureModal.reject")
          }
          description={
            actionType === "accept"
              ? t("areYouSureModal.approveBookingSure")
              : t("areYouSureModal.rejectBookingSure")
          }
          onConfirm={async () => {
            if (!selectedRowData?.slug) return;
            setLoading({ ...loading, approveReject: true });
            await Post({
              route: `admin/booking/accept/reject/${selectedRowData.slug}`,
              data: {
                status: actionType === "accept" ? "accepted" : "rejected",
              },
            });
            setShowAreYouSureModal(false);
            setLoading({ ...loading, approveReject: false });
            fetchBusData(page);
          }}
          onCancel={() => setShowAreYouSureModal(false)}
        />
      )}

      {showViewModal && (
        <DetailModal
          title={"Details"}
          show={showViewModal}
          setShow={setShowViewModal}
        >
          <div className={classes.modalMain}>
            <div className={classes.item}>
              <p>{t("table.residentName")}</p>
              <p>
                {capitalizeEachWord(
                  selectedRowData?.user?.fullName?.[locale] ??
                    selectedRowData?.data?.user?.fullName?.[locale] ??
                    "NA",
                )}
              </p>
            </div>

            <div className={classes.item}>
              <p>{t("table.roomNumber")}</p>
              <p>
                {capitalizeEachWord(
                  selectedRowData?.user?.accommodation?.accommodationNumber ??
                    selectedRowData?.data?.user?.accommodation
                      ?.accommodationNumber ??
                    "N/A",
                )}
              </p>
            </div>

            <div className={classes.item}>
              <p>{t("table.busName")}</p>
              <p>
                {capitalizeEachWord(
                  selectedRowData?.bus?.name?.[locale] ?? "N/A",
                )}
              </p>
            </div>

            <div className={classes.item}>
              <p>{t("table.busRoute")}</p>
              <p>
                {(selectedRowData?.bus?.startingPointAddress?.[locale] ??
                  selectedRowData?.data?.bus?.startingPointAddress?.[locale]) &&
                (selectedRowData?.bus?.endingPointAddress?.[locale] ??
                  selectedRowData?.data?.bus?.endingPointAddress?.[locale])
                  ? `${capitalizeEachWord(
                      selectedRowData?.bus?.startingPointAddress?.[locale] ??
                        selectedRowData?.data?.bus?.startingPointAddress?.[
                          locale
                        ],
                    )} - ${capitalizeEachWord(
                      selectedRowData?.bus?.endingPointAddress?.[locale] ??
                        selectedRowData?.data?.bus?.endingPointAddress?.[
                          locale
                        ],
                    )}`
                  : "N/A"}
              </p>
            </div>
            <div className={classes.item}>
              <p>{t("table.shift")}</p>
              <p>{capitalizeEachWord(selectedRowData?.bus?.shift ?? "N/A")}</p>
            </div>
            <div className={classes.item}>
              <p>{t("table.ArrivalDateAndTime")}</p>
              <p>
                {moment(selectedRowData?.bookingEndDate).format(
                  "DD MMM, YYYY • HH:mm A",
                ) || "N/A"}
              </p>
            </div>
            <div className={classes.item}>
              <p>{t("table.DepartureDateAndTime")}</p>
              <p>
                {moment(selectedRowData?.bookingStartDate).format(
                  "DD MMM, YYYY • HH:mm A",
                ) || "N/A"}
              </p>
            </div>

            <div className={classes.item}>
              <p>{t("table.status")}</p>
              <RenderStatusCell
                status={
                  selectedRowData?.status ??
                  selectedRowData?.data?.status ??
                  "N/A"
                }
              />
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

export default BusBookings;

export function BusDetailModal({ show, setShow, data }) {
  const locale = useLocale();
  const t = useTranslations("busBookings");

  return (
    <DetailModal
      title={t("modal.viewBookingDetails")}
      show={show}
      setShow={setShow}
    >
      <div className={classes.modalMain}>
        <div className={classes.item}>
          <p>{t("table.residentName")}</p>
          <p>
            {capitalizeEachWord(
              data?.user?.fullName?.[locale] ??
                data?.data?.user?.fullName?.[locale] ??
                "NA",
            )}
          </p>
        </div>

        <div className={classes.item}>
          <p>{t("table.roomNumber")}</p>
          <p>
            {capitalizeEachWord(
              data?.user?.accommodation?.accommodationNumber ??
                data?.data?.user?.accommodation?.accommodationNumber ??
                "N/A",
            )}
          </p>
        </div>

        <div className={classes.item}>
          <p>{t("table.busName")}</p>
          <p>{capitalizeEachWord(data?.bus?.name?.[locale] ?? "N/A")}</p>
        </div>

        <div className={classes.item}>
          <p>{t("table.busRoute")}</p>
          <p>
            {(data?.bus?.startingPointAddress?.[locale] ??
              data?.data?.bus?.startingPointAddress?.[locale]) &&
            (data?.bus?.endingPointAddress?.[locale] ??
              data?.data?.bus?.endingPointAddress?.[locale])
              ? `${capitalizeEachWord(
                  data?.bus?.startingPointAddress?.[locale] ??
                    data?.data?.bus?.startingPointAddress?.[locale],
                )} - ${capitalizeEachWord(
                  data?.bus?.endingPointAddress?.[locale] ??
                    data?.data?.bus?.endingPointAddress?.[locale],
                )}`
              : "N/A"}
          </p>
        </div>
        <div className={classes.item}>
          <p>{t("table.shift")}</p>
          <p>{capitalizeEachWord(data?.bus?.shift ?? "N/A")}</p>
        </div>
        <div className={classes.item}>
          <p>{t("table.ArrivalDateAndTime")}</p>
          <p>
            {moment(data?.bookingEndDate).format("DD MMM, YYYY • HH:mm A") ||
              "N/A"}
          </p>
        </div>
        <div className={classes.item}>
          <p>{t("table.DepartureDateAndTime")}</p>
          <p>
            {moment(data?.bookingStartDate).format("DD MMM, YYYY • HH:mm A") ||
              "N/A"}
          </p>
        </div>

        <div className={classes.item}>
          <p>{t("table.status")}</p>
          <RenderStatusCell
            status={data?.status ?? data?.data?.status ?? "N/A"}
          />
        </div>
      </div>
    </DetailModal>
  );
}
