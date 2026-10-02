"use client";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { capitalizeEachWord } from "@/resources/utils/helper";
import { VisitorBookingTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import classes from "./styles.module.css";
import { ReactSVG } from "react-svg";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import { useSelector } from "react-redux";

export default function VisitorBooking() {
  const { permissions } = useSelector((state) => state.authReducer);
  const locale = useLocale();
  const t = useTranslations("visitorBooking");
  const { Get, Post } = useAxios();
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  // const [loading, setLoading] = useState("");
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const searchDebounce = useDebounce(search, 500);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [loading, setLoading] = useState({
    tableLoading: false,
    approveReject: false,
  });

  const tableActions = useMemo(
    () => [
      {
        renderItem: ({ data }) => (
          <div className={classes.actionsMain}>
            {data.status === "pending" &&
              permissions.includes("update-visitor-booking-status") && (
                <div
                  className={classes.tableIcon}
                  title={t("action.approve")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedData(data);
                    setActionType("accept");
                    setShowAreYouSureModal(true);
                  }}
                >
                  <ReactSVG src="/svg/approved.svg" />
                </div>
              )}
            {data.status === "pending" &&
              permissions.includes("update-visitor-booking-status") && (
                <div
                  className={classes.tableIcon}
                  title={t("action.cancel")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedData(data);
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
                setSelectedData(data);
                setShowDetail(true);
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
  async function fetchData({ search, page }) {
    const query = {
      search: search,
      page: page,
      serviceType: "accommodation",
      limit: RECORDS_LIMIT,
    };
    const queryParams = new URLSearchParams(query).toString();

    // setLoading("loading");
    setLoading({ ...loading, tableLoading: true });

    const { response } = await Get({
      route: `admin/booking/all?${queryParams}`,
    });

    if (response) {
      setTableData(response.data);
      setTotalRecords(response.totalRecords);
    }
    setLoading({ ...loading, tableLoading: false });
  }

  useEffect(() => {
    fetchData({
      search: searchDebounce,
      page: 1,
    });
  }, [searchDebounce]);

  return (
    <div className={classes.visitorBooking}>
      <Container className="containerFluid">
        <SubHeader
          title={t("title")}
          showBackBtn
          showSearchAndFilter
          searchProps={{
            search,
            setSearch: (value) => {
              setSearch(value);
              setPage(1);
            },
          }}
        />
        <div className={classes.tableContainer}>
          <AppTable
            tableHeader={VisitorBookingTableHeader(t, locale)}
            data={tableData}
            loading={loading.tableLoading}
            pagination
            actions={tableActions}
            page={page}
            totalRecords={totalRecords}
            tableMinWidth="1200px"
            onPageChange={(p) => {
              setPage(p);
              fetchData({ page: p, search: searchDebounce });
            }}
            onRowClick={(data) => {
              setSelectedData(data);
              setShowDetail(true);
            }}
          />
        </div>
      </Container>

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
            if (!selectedData?.slug) return;
            setLoading({ ...loading, approveReject: true });
            await Post({
              route: `admin/booking/accept/reject/${selectedData.slug}`,
              data: {
                status: actionType === "accept" ? "accepted" : "rejected",
              },
            });
            setShowAreYouSureModal(false);
            setLoading({ ...loading, approveReject: false });
            fetchData({ page: page, search: searchDebounce });
          }}
          onCancel={() => setShowAreYouSureModal(false)}
        />
      )}

      {showDetail && (
        <VisitorDetailModal
          show={showDetail}
          setShow={setShowDetail}
          data={selectedData}
        />
      )}
    </div>
  );
}

export function VisitorDetailModal({ show, setShow, data }) {
  const locale = useLocale();
  const t = useTranslations("visitorBooking");

  return (
    <DetailModal
      title={t("viewModalTitle")}
      show={show}
      setShow={setShow}
    >
      <div className={classes.modalMain}>
        <div className={classes.item}>
          <p>{t("modal.residentName")}</p>
          <p>
            {capitalizeEachWord(data?.user?.fullName?.[locale] || "-")}
          </p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.visitorName")}</p>
          <p>{capitalizeEachWord(data?.visitorName || "-")}</p>
        </div>
        <div className={classes.item}>
          <p>{t("modal.dateAndTime")}</p>
          <p>
            {data?.bookingStartDate
              ? `${moment(data.bookingStartDate).format(
                  "DD MMM, YYYY • HH:mm A"
                )} - ${moment(data.bookingEndDate).format("HH:mm A")}`
              : "-"}
          </p>
        </div>

        <div className={classes.item}>
          <p>{t("modal.createdAt")}</p>
          <p>
            {data?.createdAt
              ? moment(data.createdAt).format("DD MMM, YYYY")
              : "-"}
          </p>
        </div>

        <div className={classes.item}>
          <p>{t("modal.additionalNotes")}</p>
          <p>{data?.additionalNotes || "-"}</p>
        </div>
      </div>
    </DetailModal>
  );
}
