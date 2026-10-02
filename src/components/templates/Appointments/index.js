/* eslint-disable react-hooks/exhaustive-deps */
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
import { AppointmentsTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { CiCalendar } from "react-icons/ci";
import { HiMenu } from "react-icons/hi";
import { ReactSVG } from "react-svg";
import classes from "./styles.module.css";
import { useSelector } from "react-redux";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";

export default function AppointmentsTemplate() {
  const { permissions } = useSelector((state) => state.authReducer);
  // console.log(permissions, "permissions");
  const t = useTranslations("appointments");
  const locale = useLocale();
  const [activeIcon, setActiveIcon] = useState("menu");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState({
    tableLoading: false,
    gettingCalendar: false,
    approveReject: false,
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [dataCalender, setDataCalender] = useState([]);
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const { Get, Post } = useAxios();
  const tabsData = [
    { value: "all", label: t("tabs.all") },
    { value: "completed", label: t("tabs.completed") },
    { value: "cancelled", label: t("tabs.cancelled") },
    { value: "pending", label: t("tabs.pending") },
    { value: "rejected", label: t("tabs.rejected") },
  ];
  const [selectedTab, setSelectedTab] = useState(tabsData[0]);
  const menuItems = useMemo(
    () => [
      {
        title: t("menuItems.edit"),
        onClick: (e) => console.log(`Edit: ${e.value}`),
        style: {
          color: "var(--Black)",
          fontWeight: 500,
        },
      },
      {
        title: t("menuItems.delete"),
        onClick: async (e) => console.log(`Delete: ${e.value}`),
        style: {
          color: "var(--Red)",
          fontWeight: 500,
        },
      },
    ],
    [t]
  );

  const getData = useCallback(
    async ({ page_ = page, search_ = search, tabs_ = selectedTab }) => {
      setLoading((prev) => ({ ...prev, tableLoading: true }));
      const sParams = new URLSearchParams({
        serviceType: "staff",
        status: tabs_?.value,
        search: search_?.trim(),
        page: page_,
        limit: 10,
      });
      const { response } = await Get({
        route: `admin/booking/all?${sParams.toString()}`,
      });
      if (response) {
        setData(response?.data);
        setTotalRecords(response?.totalRecords || response?.data?.length || 0);
      }
      setLoading((prev) => ({ ...prev, tableLoading: false }));
    },
    [selectedTab]
  );

  useEffect(() => {
    getData({
      page_: 1,
      search_: debouncedSearch,
      tabs_: selectedTab,
    });
  }, [debouncedSearch, page, selectedTab]);

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

  const fetchAppointment = useCallback(async () => {
    setLoading((prev) => ({ ...prev, gettingCalendar: true }));
    const sParams = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
    const { response } = await Get({
      route: `admin/booking/all?${sParams.toString()}`,
    });
    if (response) {
      setDataCalender(response?.data);
    }
    setLoading((prev) => ({ ...prev, gettingCalendar: false }));
  }, [Get, dateRange]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchAppointment();
    }
  }, [dateRange]);

  const handleEventClick = useCallback((event) => {
    setSelectedRowData(event?.resource);
    setShowViewModal(true);
  }, []);

  const events = useMemo(() => {
    return (
      dataCalender?.map((appointment) => ({
        id: appointment?.slug,
        title: `${appointment?.user?.fullName?.[locale] ?? "NA"} - ${
          appointment?.reasonForMeeting ?? "NA"
        }`,
        start: moment(appointment.bookingStartDate).format("YYYY-MM-DD"),
        end: moment(appointment.bookingEndDate).format("YYYY-MM-DD"),
        status: appointment?.status,
        resource: {
          ...appointment,
        },
      })) || []
    );
  }, [dataCalender]);

  const tableActions = useMemo(
    () => [
      {
        renderItem: ({ data }) => (
          <div className={classes.actionsMain}>
            {data.status === "pending" &&
              permissions.includes("update-staff-booking-status") && (
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
            {data.status === "pending" &&
              permissions.includes("update-staff-booking-status") && (
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
    ],
    [menuItems]
  );

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
              setSelected: (val) => setSelectedTab(val),
            }}
            searchAndFilterAtTop={false}
            showSearchAndFilter
            searchProps={{
              search: search,
              setSearch: setSearch,
              placeholder: t("searchPlaceholder"),
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

          <div className={classes.tableMain}>
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
              <AppTable
                tableHeader={AppointmentsTableHeader(t, locale)}
                data={data}
                actions={tableActions}
                actionStyles={{
                  width: "7%",
                }}
                loading={loading.tableLoading}
                totalRecords={totalRecords}
                pagination
                page={page}
                onRowClick={(rowData) => {
                  setSelectedRowData(rowData);
                  setShowViewModal(true);
                }}
                onPageChange={(p) => {
                  setPage(p);
                  getData(p);
                }}
              />
            )}
          </div>
        </Container>
      </div>
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
            setLoading((prev) => ({ ...prev, approveReject: true }));
            await Post({
              route: `admin/booking/accept/reject/${selectedRowData.slug}`,
              data: {
                status: actionType === "accept" ? "accepted" : "rejected",
              },
            });
            setShowAreYouSureModal(false);
            setLoading((prev) => ({ ...prev, approveReject: false }));
            getData(page);
          }}
          onCancel={() => setShowAreYouSureModal(false)}
        />
      )}
      {showViewModal && (
        <AppointmentDetailModal
          show={showViewModal}
          setShow={setShowViewModal}
          data={selectedRowData}
        />
      )}
    </>
  );
}

export function AppointmentDetailModal({ show, setShow, data }) {
  const locale = useLocale();
  const t = useTranslations("appointments");

  return (
    <DetailModal show={show} setShow={setShow} title={t("modal.title")}>
      <div className={classes.modalMain}>
        <div className={classes.item}>
          <p>{t("modal.name")}</p>
          <p>{data?.user?.fullName?.[locale] || "N/A"}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.roomNumber")}</p>
          <p>
            {capitalizeEachWord(
              data?.user?.accommodation?.accommodationNumber || "N/A"
            )}
          </p>
        </div>

        <div className={classes.item}>
          <p>{t("modal.dateTime")}</p>
          <p>
            {data?.bookingStartDate
              ? moment(data.bookingStartDate).format("YYYY-MM-DD • h:mmA")
              : "N/A"}
          </p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.notes")}</p>
          <p>{capitalizeEachWord(data?.reasonForMeeting || "N/A")}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.purpose")}</p>
          <p>{capitalizeEachWord(data?.additionalNotes || "N/A")}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.appointmentType")}</p>
          <p>{capitalizeEachWord(data?.serviceType || "N/A")}</p>
        </div>

        <div className={classes.item}>
          <p>{t("modal.status")}</p>
          <RenderStatusCell status={data?.status} />
        </div>
      </div>
    </DetailModal>
  );
}
