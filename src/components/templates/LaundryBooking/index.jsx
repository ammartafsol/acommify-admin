"use client";
import Wrapper from "@/components/atoms/Wrapper/Wrapper";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import CalendarComponent from "@/components/organisms/Calender/Calender";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { capitalizeEachWord } from "@/resources/utils/helper";
import { LaundryBookingTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { CiCalendar } from "react-icons/ci";
import { HiMenu } from "react-icons/hi";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import classes from "./styles.module.css";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";

export default function LaundryBookingTemplate() {
  const locale = useLocale();
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("laundryBooking");
  const tabsData = [
    {
      label: t("tabs.all"),
      value: "all",
      id: "all",
    },
    {
      label: t("tabs.pending"),
      value: "pending",
      id: "pending",
    },
    {
      label: t("tabs.rejected"),
      value: "rejected",
      id: "rejected",
    },
    {
      label: t("tabs.cancelled"),
      value: "cancelled",
      id: "cancelled",
    },
    {
      label: t("tabs.acceptedORConfirmed"),
      value: "accepted",
      id: "accepted",
    },
  ];
  const [activeIcon, setActiveIcon] = useState("menu");
  const [selectedTab, setSelectedTab] = useState(tabsData[0]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [dataCalender, setDataCalender] = useState([]);
  const [laundryData, setLaundryData] = useState([]);
  const [loading, setLoading] = useState({
    tableLoading: false,
    gettingCalendar: false,
    approveReject: false,
  });
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { Get, Post } = useAxios();
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const fetchLaundryData = async (_page = 1) => {
    setLoading((prev) => ({ ...prev, tableLoading: true }));
    const sParams = new URLSearchParams({
      serviceType: "laundry",
      page: _page,
      search: debounceSearch,
      limit: 10,
      status: selectedTab.value,
    });
    const { response } = await Get({
      route: `admin/booking/all?${sParams.toString()}`,
    });
    if (response?.data) {
      setLaundryData(response.data);
      setTotalRecords(response?.totalRecords || response?.data?.length || 0);
    }
    setLoading((prev) => ({ ...prev, tableLoading: false }));
  };

  const handleRangeChange = useCallback((e) => {
    let start, end;

    if (e.start && e.end) {
      ({ start, end } = e);
    } else if (Array.isArray(e)) {
      if (e.length === 1) {
        start = e[0];
        end = moment(e[0]).endOf("day").toDate();
      } else {
        start = e[0];
        end = moment(e[e.length - 1])
          .endOf("day")
          .toDate();
      }
    }
    start = moment(start).format("YYYY-MM-DD");
    end = moment(end).format("YYYY-MM-DD");

    setDateRange({ start, end });
  }, []);

  const fetchLaundryBooking = useCallback(async () => {
    setLoading((prev) => ({ ...prev, gettingCalendar: true }));
    const sParams = new URLSearchParams({
      serviceType: "laundry",
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
    const { response } = await Get({
      route: `admin/booking/all?${sParams.toString()}`,
    });
    if (response?.status === "success") {
      setDataCalender(response?.data);
    }
    setLoading((prev) => ({ ...prev, gettingCalendar: false }));
  }, [Get, dateRange]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchLaundryBooking();
    }
  }, [dateRange]);

  useEffect(() => {
    fetchLaundryData(page);
  }, [debounceSearch, selectedTab]);

  const events = useMemo(() => {
    return (
      dataCalender?.map((booking) => ({
        id: booking?.slug,
        title: `${booking?.user?.fullName?.[locale]} - ${booking?.machine?.name?.[locale]}`,
        start: moment(booking.bookingStartDate).format("YYYY-MM-DD"),
        end: moment(booking.bookingEndDate).format("YYYY-MM-DD"),
        status: booking?.status,
        resource: {
          ...booking,
        },
      })) || []
    );
  }, [dataCalender]);

  const tableActions = permissions.includes("update-laundry-booking-status")
    ? [
        {
          renderItem: ({ data }) => (
            <div className={classes.actionsMain}>
              {data.status === "pending" && (
                <div
                  className={classes.tableIcon}
                  title={t("actions.approve")}
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
                  title={t("actions.cancel")}
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
                title={t("actions.view")}
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
      ]
    : [];

  const handleEventClick = useCallback((event) => {
    setSelectedRowData(event?.resource);
    setShowViewModal(true);
  }, []);

  return (
    <>
      <div className={classes.container}>
        <Container className="containerFluid">
          <SubHeader
            showBackBtn
            title={t("title")}
            tabsProps={{
              tabsData: activeIcon === "calendar" ? [] : tabsData,
              selected: selectedTab,
              setSelected: setSelectedTab,
            }}
            searchAndFilterAtTop
            showSearchAndFilter
            searchProps={{
              search: search,
              setSearch: (value) => {
                setSearch(value);
                setPage(1);
              },
            }}
          >
            <div className={classes.icons}>
              <div
                className={classes.icon}
                onClick={() => setActiveIcon("menu")}
              >
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
          {activeIcon === "calendar" ? (
            <div className={classes.content}>
              <Wrapper
                active={loading.gettingCalendar}
                loading={loading.gettingCalendar}
                zIndex={1000}
                message={null}
              >
                <CalendarComponent
                  onRangeChange={handleRangeChange}
                  events={events || []}
                  onEventClick={handleEventClick}
                />
              </Wrapper>
            </div>
          ) : (
            <div className={classes.content}>
              <AppTable
                tableHeader={LaundryBookingTableHeader(t, locale)}
                data={laundryData}
                actions={tableActions}
                pagination
                page={page}
                totalRecords={totalRecords}
                loading={loading.tableLoading}
                onPageChange={(p) => {
                  setPage(p);
                  fetchLaundryData(p);
                }}
                actionStyles={{
                  width: "15%",
                }}
                onRowClick={(rowData) => {
                  setSelectedRowData(rowData);
                  setShowViewModal(true);
                }}
              />
            </div>
          )}
        </Container>
      </div>

      {showViewModal && (
        <LaundryDetailModal
          show={showViewModal}
          setShow={setShowViewModal}
          data={selectedRowData}
        />
      )}

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
            fetchLaundryData(page);
          }}
          onCancel={() => setShowAreYouSureModal(false)}
        />
      )}
    </>
  );
}

export function LaundryDetailModal({ show, setShow, data }) {
  const locale = useLocale();
  const t = useTranslations("laundryBooking");

  return (
    <DetailModal
      show={show}
      setShow={setShow}
      title={t("modal.viewBookingDetails")}
    >
      <div className={classes.modalMain}>
        <div className={classes.item}>
          <p>{t("modal.residentName")}</p>
          <p>{data?.user?.fullName?.[locale] || "N/A"}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.roomNumber")}</p>
          <p>{data?.user?.accommodation?.accommodationNumber || "N/A"}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.machineName")}</p>
          <p>{capitalizeEachWord(data?.machine?.name?.[locale]) || "N/A"}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.laundryDate")}</p>
          <p>{moment(data?.bookingStartDate).format("DD MMM, YYYY ")}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.timeSlot")}</p>
          <p>
            {" "}
            {moment(data?.bookingStartDate).format(" HH:mm A") +
              moment(data?.bookingEndDate).format(" - HH:mm A") || "N/A"}
          </p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.status")}</p>
          <RenderStatusCell status={data?.status} />
        </div>
      </div>
    </DetailModal>
  );
}
