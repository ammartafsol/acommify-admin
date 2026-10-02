"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AddEditBusinessAdminModal from "@/components/organisms/Modals/AddEditBusinessAdminModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { mergeClass } from "@/resources/utils/helper";
import { NationwideDashboardTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import AddEditNationwideDashboardModal from "@/components/organisms/Modals/AddEditNationwideDashboardModal";

export default function NationwideDashboard() {
  const { permissions } = useSelector((state) => state.authReducer);
  const [show, setShow] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const t = useTranslations("nationwideDashboardPage");
  const [loading, setLoading] = useState({
    getData: false,
  });
  const { Get } = useAxios();
  const [data, setData] = useState([]);
  const locale = useLocale();

  const menuItems = [
    {
      title: t("actions.view"),
      onClick: ({ value }) => {
        setModalData(value);
        setShowDetailModal(true);
      },
      style: { color: "var(--Black)", fontWeight: 500 },
    },
    {
      title: t("actions.edit"),
      onClick: ({ value }) => {
        setModalData(value);
        setShow(true);
      },
      style: { color: "var(--Black)", fontWeight: 500 },
    },
  ];

  const tableActions = [
    {
      renderItem: ({ data: row }) => (
        <MenuComponent
          portal
          items={menuItems.map((item) => ({
            ...item,
            onClick: () => item.onClick({ value: row }),
          }))}
          menuButton={
            <TbDotsVertical
              color="#B2B5BA"
              onClick={(e) => e.stopPropagation()}
              className="pointer"
              size={20}
            />
          }
          value={row}
        />
      ),
    },
  ];

  async function getData({ _search = search, _page = page } = {}) {
    const params = new URLSearchParams({
      search: _search?.trim() || "",
      page: _page,
      limit: RECORDS_LIMIT,
    });
    setLoading((prev) => ({ ...prev, getData: true }));
    const { response } = await Get({
      route: `admin/user/all?role=nation-wide&${params.toString()}`,
    });

    if (response) {
      setData(response?.data ?? []);
      setTotalRecords(response?.totalRecords ?? 0);
    }
    setLoading((prev) => ({ ...prev, getData: false }));
  }

  useEffect(() => {
    getData({ _search: debounceSearch, _page: 1 });
  }, [debounceSearch]);

  const handleSave = () => {
    setModalData(null);
    getData();
  };

  const handleCloseModal = () => {
    if (loading.getData) return;
    setModalData(null);
    setShow(false);
  };

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showBackBtn
          showSearchAndFilter
          searchAndFilterAtTop
          searchProps={{
            search,
            setSearch: (value) => {
              setSearch(value);
              setPage(1);
            },
          }}
          buttonProps={
            permissions.includes("add-edit-nation-wide")
              ? {
                  label: t("addButton"),
                  variant: "primary",
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
                  onClick: () => {
                    setModalData(null);
                    setShow(true);
                  },
                }
              : undefined
          }
        />
        <AppTable
          tableHeader={NationwideDashboardTableHeader(t, locale)}
          data={data}
          actions={
            permissions.includes("add-edit-nation-wide") ? tableActions : []
          }
          loading={loading.getData}
          actionStyles={{ width: "10%" }}
          rowClassName="c-p"
          onRowClick={(row) => {
            setModalData(row);
            setShowDetailModal(true);
          }}
          pagination
          page={page}
          onPageChange={(p) => {
            setPage(p);
            getData({ _page: p, _search: debounceSearch });
          }}
          totalRecords={totalRecords}
        />
      </Container>

      {show && (
        <AddEditNationwideDashboardModal
          setShow={handleCloseModal}
          show={show}
          modalData={modalData}
          setModalData={setModalData}
          onSave={handleSave}
        />
      )}

      {showDetailModal && (
        <DetailModal
          title={t("modal.detailTitle")}
          show={showDetailModal}
          setShow={setShowDetailModal}
        >
          <div className={styles.modalMain}>
            <div className={styles.item}>
              <p>{t("fields.fullName")}</p>
              <p>{modalData?.fullName?.[locale] || "NA"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("fields.email")}</p>
              <p>{modalData?.email || "NA"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("fields.phone")}</p>
              <p>
                {modalData?.callingCode && modalData?.phoneNumber != null
                  ? `(${modalData.callingCode}) ${modalData.phoneNumber}`
                  : "NA"}
              </p>
            </div>
            <div className={styles.item}>
              <p>{t("table.statusTitle")}</p>
              <RenderStatusCell status={modalData?.status} />
            </div>
          </div>
        </DetailModal>
      )}
    </>
  );
}
