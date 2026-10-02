"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AddNewIncidentReportModal from "@/components/organisms/Modals/AddNewIncidentReportModal/AddNewIncidentReportModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { capitalizeEachWord, mergeClass } from "@/resources/utils/helper";
import { IncidentReportsTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { IoAddOutline } from "react-icons/io5";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import styles from "./styles.module.css";

export default function IncidentReports() {
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("incidentReportsPage");
  const locale = useLocale();
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [page, setPage] = useState();
  const [totalRecords, setTotalRecords] = useState(0);
  const tabsData = [
    { value: "all", label: t("tabs.all") },
    { value: "resolved", label: t("tabs.resolved") },
    { value: "under-review", label: t("tabs.underReview") },
    { value: "escalated", label: t("tabs.escalated") },
  ];
  const [activeTab, setActiveTab] = useState(tabsData[0]);
  const { Get } = useAxios();
  const [incidentsData, setIncidentsData] = useState("");
  const [loading, setLoading] = useState("");
  const menuItems = [
    {
      title: t("actions.edit"),
      onClick: (data) => {
        console.log("Edit report data:", data);
        setModalData(data);
        setShowModal(true);
      },
      style: { color: "var(--Black)", fontWeight: 500 },
    },
  ];

  const tableActions =
    permissions.includes("add-incident-report") &&
    permissions.includes("view-residents") &&
    permissions.includes("view-staff")
      ? [
          {
            renderItem: ({ data }) => (
              <MenuComponent
                portal
                items={menuItems.map((item) => ({
                  ...item,

                  onClick: () => item.onClick(data),
                }))}
                menuButton={
                  <TbDotsVertical
                    color="#B2B5BA"
                    onClick={(e) => e.stopPropagation()}
                    className="pointer"
                    size={20}
                  />
                }
                value={data}
              />
            ),
          },
        ]
      : [];

  async function getIncidentsData({
    _search = search,
    _filter = activeTab,
    _page = page,
  } = {}) {
    const params = new URLSearchParams({
      search: _search?.trim(),
      status: _filter?.value,
      page: _page,
      limit: 10,
    });
    setLoading("loading");
    const { response } = await Get({
      route: `admin/incident-report/all?${params.toString()}`,
    });

    if (response) {
      setIncidentsData(response?.data || []);
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  const handleSave = () => {
    setModalData(null);
    getIncidentsData({
      _search: debounceSearch,
      _filter: activeTab,
      _page: 1,
    });
  };

  const handleCloseModal = () => {
    if (loading === "loading") return;
    setModalData(null);
    setShowModal(false);
  };

  useEffect(() => {
    getIncidentsData({ _search: debounceSearch, _filter: activeTab, _page: 1 });
  }, [debounceSearch, activeTab]);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader
        title={t("title")}
        showSearchAndFilter
        searchAndFilterAtTop
        tabsProps={{
          selected: activeTab,
          setSelected: setActiveTab,
          tabsData,
        }}
        buttonProps={
          permissions.includes("add-incident-report") &&
          permissions.includes("view-residents") &&
          permissions.includes("view-staff")
            ? {
                label: t("addNewReport"),
                variant: "primary",
                leftIcon: <IoAddOutline size={20} />,
                onClick: () => setShowModal(true),
              }
            : undefined
        }
        searchProps={{
          search: search,
          setSearch: setSearch,
        }}
      />

      <AppTable
        tableHeader={IncidentReportsTableHeader(t, locale)}
        rowClassName="c-p"
        data={incidentsData}
        actions={tableActions}
        pagination
        page={page}
        onPageChange={(p) => {
          setPage(p);
          getIncidentsData({ _page: p, _search: debounceSearch });
        }}
        totalRecords={totalRecords}
        actionStyles={{
          width: "5%",
          minWidth: "100px",
        }}
        tableMinWidth="1700px"
        onRowClick={(data) => {
          setModalData(data);
          setShowDetailModal(true);
        }}
        loading={loading === "loading"}
        noDataText={t("noDataText")}
      />

      {showModal && (
        <AddNewIncidentReportModal
          show={showModal}
          setShow={handleCloseModal}
          onSave={handleSave}
          modalData={modalData}
          setModalData={setModalData}
        />
      )}

      {showDetailModal && (
        <IncidentReportDetail
          show={showDetailModal}
          setShow={setShowDetailModal}
          data={modalData}
        />
      )}
    </Container>
  );
}

export function IncidentReportDetail({ show, setShow, data }) {
  const t = useTranslations("incidentReportsPage");
  const locale = useLocale();

  return (
    <DetailModal
      show={show}
      setShow={setShow}
      data={data}
      title={t("modal.detailTitle")}
    >
      <div className={styles.modalMain}>
        <div className={styles.item}>
          <p>{t("table.incidentId")}</p>
          <p>{data?.incidentId || "NA"}</p>
        </div>
        <div className={styles.item}>
          <p>{t("table.title")}</p>
          <p>{capitalizeEachWord(data?.title[locale] || "NA")}</p>
        </div>

        <div className={styles.item}>
          <p>{t("table.residentInvolved")}</p>
          <p>
            {capitalizeEachWord(
              data?.residentInvolved?.fullName[locale] || "NA",
            )}
          </p>
        </div>
        <div hidden={!data?.assignedTo?.fullName} className={styles.item}>
          <p>{t("table.reportedBy")}</p>
          <p>
            {capitalizeEachWord(data?.assignedTo?.fullName?.[locale] || "NA")}
          </p>
        </div>

        <div className={styles.item}>
          <p>{t("table.location")}</p>
          <p>{capitalizeEachWord(data?.address[locale] || "NA")}</p>
        </div>
        <div className={styles.item}>
          <p>{t("table.severity")}</p>
          <RenderStatusCell status={data?.severity} />
        </div>
        <div className={styles.item}>
          <p>{t("table.dateTime")}</p>
          <p>
            {moment(data?.createdAt).format("DD MMM, YYYY , HH:mm A") || "NA"}
          </p>
        </div>
        {data?.status === "resolved" && (
          <div className={styles.item}>
            <p>{t("table.completedDate")}</p>
            <p>{moment(data?.completedDate).format("DD MMM, YYYY") || "NA"}</p>
          </div>
        )}
        <div className={styles.item}>
          <p>{t("table.status")}</p>
          <RenderStatusCell status={data?.status} />
        </div>
        <div className={mergeClass(styles.item, styles.description)}>
          <p>{t("table.description")}</p>
          <p>{data?.description?.[locale] || "NA"}</p>
        </div>
      </div>
    </DetailModal>
  );
}
