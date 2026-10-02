"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import {
  RenderStatusCell,
  RenderSwitchCell,
} from "@/components/organisms/AppTable/tableHelper";
import AddStaffFormModal from "@/components/organisms/Modals/AddStaffFormModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { StaffsTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import moment from "moment-timezone";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";

export default function Staffs() {
  const { permissions } = useSelector((state) => state.authReducer);
  const [show, setShow] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const t = useTranslations("staffsPage");
  const [loading, setLoading] = useState({
    getData: false,
    editStaff: false,
    deleteStaff: false,
  });
  const { Get, Patch } = useAxios();
  const [data, setData] = useState([]);
  const locale = useLocale();
  const menuItems = [
    {
      title: t("actions.edit"),
      onClick: (data) => {
        if (permissions?.includes("add-edit-staff")) {
          // console.log("Edit staff data:", data?.value);
          setModalData(data?.value);
          setShow(true);
        }
      },
      style: {
        color: permissions?.includes("add-edit-staff")
          ? "var(--Black)"
          : "#ccc",
        fontWeight: 500,
        cursor: permissions?.includes("add-edit-staff")
          ? "pointer"
          : "not-allowed",
      },
      disabled: !permissions?.includes("add-edit-staff"),
    },
    {
      title: t("actions.delete"),
      onClick: (data) => {
        setModalData(data?.value);
        setShowDeleteModal(true);
      },
      style: {
        color: "var(--Red)",
      },
    },
  ];

  const tableActions = permissions?.includes("add-edit-staff")
    ? [
        {
          renderItem: ({ data }) => (
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
              value={data}
            />
          ),
        },
      ]
    : [];

  const switchItem = {
    key: "status",
    title: t("table.status"),
    styles: { width: "10%" },
    renderItem: ({ data }) => (
      <RenderSwitchCell
        isActive={data?.status === "active"}
        disabled={!permissions?.includes("add-edit-staff")}
        onChange={(newValue) => toggleStatus(newValue, data)}
      />
    ),
  };

  async function getData({ _search = search, _page = page } = {}) {
    const params = new URLSearchParams({
      role: "staff",
      search: _search?.trim(),
      page: _page,
      limit: 10,
    });
    setLoading((prev) => ({ ...prev, getData: true }));
    const { response } = await Get({
      route: `admin/user/all?${params.toString()}`,
    });

    if (response) {
      const data = response?.data;
      setData(data);
      setTotalRecords(response?.totalRecords);
    }

    setLoading((prev) => ({ ...prev, getData: false }));
  }

  useEffect(() => {
    getData({ _search: debounceSearch, _page: 1 });
  }, [debounceSearch]);

  const toggleStatus = async (newValue, item) => {
    if (!permissions?.includes("add-edit-staff")) return;
    if (!item?.slug) return;
    setLoading((prev) => ({ ...prev, editStaff: true }));
    const newStatus =
      newValue === "delete" ? newValue : newValue ? "active" : "inactive";
    const { response } = await Patch({
      route: `admin/user/update/${item.slug}`,
      data: { status: newStatus },
    });
    if (response) {
      RenderToast({
        type: "success",
        message: t("toast.staffStatus"),
      });
      getData();
    }
    setLoading((prev) => ({ ...prev, editStaff: false }));
  };

  const deleteStaff = async (item) => {
    if (!item?.slug) return;
    setLoading((prev) => ({ ...prev, deleteStaff: true }));
    const { response } = await Patch({
      route: `admin/user/update/${item.slug}`,
      data: { status: "deleted" },
    });
    if (response) {
      setLoading((prev) => ({ ...prev, deleteStaff: false }));
      setShowDeleteModal(false);
      setModalData(null);
      RenderToast({
        type: "success",
        message: t("toast.staffDeleted"),
      });
      getData();
    }
  };

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showSearchAndFilter
          searchAndFilterAtTop
          searchProps={{
            search: search,
            setSearch: setSearch,
          }}
          buttonProps={
            permissions?.includes("add-edit-staff")
              ? {
                  label: t("addMember"),
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
          tableHeader={[...StaffsTableHeader(t, locale), switchItem]}
          data={data}
          actions={tableActions}
          loading={loading.getData || loading.editStaff}
          actionStyles={{
            width: "10%",
          }}
          rowClassName="c-p"
          onRowClick={(data) => {
            setModalData(data);
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
        <AddStaffFormModal
          getData={getData}
          show={show}
          setShow={setShow}
          data={modalData || null}
        />
      )}
      {showDetailModal && (
        <DetailModal
          title={t("modal.title")}
          show={showDetailModal}
          setShow={setShowDetailModal}
        >
          <div className={styles.modalMain}>
            <div className={styles.item}>
              <p>{t("modal.staffID")}</p>
              <p>{modalData?.userId || "NA"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("modal.name")}</p>
              <p>{modalData?.fullName?.[locale] || "NA"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("modal.email")}</p>
              <p>{modalData?.email || "NA"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("modal.phone")}</p>
              <p>
                {`(${modalData?.callingCode}) ${modalData?.phoneNumber}` ||
                  "NA"}
              </p>
            </div>

            <div className={styles.item}>
              <p>{t("modal.shiftTime")}</p>
              <p>
                {modalData?.shiftStart &&
                moment(modalData.shiftStart, "HH:mm:ss").isValid()
                  ? moment(modalData.shiftStart, "HH:mm:ss").format("hh:mm A")
                  : "NA"}
                {" - "}
                {modalData?.shiftEnd &&
                moment(modalData.shiftEnd, "HH:mm:ss").isValid()
                  ? moment(modalData.shiftEnd, "HH:mm:ss").format("hh:mm A")
                  : "NA"}
              </p>
            </div>
            {/* <div className={styles.item}>
            <p>{t("modal.position")}</p>
            <p>{modalData?.position?.[locale] || "NA"}</p>
          </div> */}
            <div className={styles.item}>
              <p>{t("modal.status")}</p>
              <RenderStatusCell status={modalData?.status} />
            </div>
          </div>
        </DetailModal>
      )}
      {showDeleteModal && (
        <AreYouSureModal
          onConfirm={() => deleteStaff(modalData)}
          loading={loading.deleteStaff}
          message={t("modal.deleteMessage")}
          show={showDeleteModal}
          setShow={setShowDeleteModal}
        />
      )}
    </>
  );
}
