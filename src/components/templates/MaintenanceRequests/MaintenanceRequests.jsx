"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import EditMaintenanceRequests from "@/components/organisms/Modals/EditMaintenanceRequests/EditMaintenanceRequests";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import {
  imageUrl,
  isAdminOrBusinessOwner,
  mergeClass,
} from "@/resources/utils/helper";
import { MaintenanceRequestsTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import styles from "./styles.module.css";

export default function MaintenanceRequests() {
  const { user } = useSelector((state) => state.authReducer);
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("maintenanceRequestsPage");
  const { Get, Patch } = useAxios();
  const locale = useLocale();
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [tableData, setTableData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState("");
  const [search, setSearch] = useState("");
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [modalActionType, setModalActionType] = useState(null); // "accept" or "reject"

  const tabsData = [
    { value: "all", label: t("tabs.all") },
    { value: "pending", label: t("tabs.pending") },
    { value: "in-progress", label: t("tabs.inprogress") },
    { value: "rejected", label: t("tabs.rejected") },
    { value: "completed", label: t("tabs.completed") },
    { value: "escalated", label: t("tabs.escalated") },
  ];

  const getMenuItems = (data) => {
    const items = [
      {
        title: t("actions.view"),
        onClick: (data) => {
          setSelectedRowData(data);
          setViewDetailModal(true);
        },
        style: { color: "var(--Black)", fontWeight: 500 },
      },
    ];

    if (
      (user?.role === "staff" &&
        (data?.assignedTo?.userId === user?.userId ||
          data?.assignedTo?._id === user?._id) &&
        data?.status === "in-progress") ||
      (isAdminOrBusinessOwner(user?.role) && data?.status !== "rejected")
    ) {
      items.push({
        title: t("actions.edit"),
        style: { color: "var(--Black)", fontWeight: 500 },
        onClick: (data) => {
          setSelectedRowData(data);
          setEditModal(true);
        },
      });
    }

    if (user?.role === "staff" && data?.status === "pending") {
      items.push({
        title: t("actions.acceptTask"),
        onClick: (data) => {
          setSelectedRowData(data);
          setModalActionType("accept");
          setShowAreYouSureModal(true);
        },
        style: { color: "var(--Black)", fontWeight: 500 },
      });
    }

    if (isAdminOrBusinessOwner(user?.role) && data?.status === "pending") {
      items.push({
        title: t("actions.rejectRequest"),
        onClick: (data) => {
          setSelectedRowData(data);
          setModalActionType("reject");
          setShowAreYouSureModal(true);
        },
        style: { color: "var(--Red)", fontWeight: 500 },
      });
    }

    return items;
  };

  const [activeTab, setActiveTab] = useState(tabsData[0]);
  const searchDebounce = useDebounce(search, 500);

  const tableActions = permissions.includes(
    "approve-reject-maintenance-request",
  )
    ? [
        {
          renderItem: ({ data }) => (
            <MenuComponent
              portal
              items={getMenuItems(data).map((item) => ({
                ...item,
                onClick: () => item.onClick(data),
              }))}
              menuButton={
                <TbDotsVertical
                  color="#B2B5BA"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRowData(data);
                  }}
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

  const fetchData = async ({ status, searchDebounce, currentPage }) => {
    const query = {
      status,
      search: searchDebounce,
      page: currentPage,
      limit: 10,
    };

    const queryString = new URLSearchParams(query).toString();
    setLoading("loading");
    const { response } = await Get({
      route: `admin/maintenance-request/all?${queryString}`,
    });
    if (response) {
      const formattedData = response.data.map((item) => ({
        ...item,
        residentName: item?.user?.fullName[locale] || "N/A",
        roomNumber: item?.accommodation?.accommodationNumber || "N/A",
        requestDateTime: moment(item?.createdAt).format("YYYY-MM-DD • h:mmA"),
        issueCategory: item?.category?.name[locale] || "N/A",
        shortDescription: item?.description || "N/A",
        status: item?.status || "N/A",
      }));
      setTableData(formattedData);
      setTotalRecords(response?.totalRecords || 0);
    }
    setLoading("");
  };

  // reject request for admin
  const rejectRequestHandler = async (data) => {
    setLoading("rejecting");
    const payload = {
      staffSlug: data?.user?.slug,
      status: "rejected",
    };

    const { response } = await Patch({
      route: `admin/maintenance-request/approve/reject/${data?.slug}`,
      data: payload,
    });
    if (response) {
      setShowAreYouSureModal(false);
      setModalActionType(null);
      RenderToast({
        type: "success",
        message: t("requestRejectedSuccessfully"),
      });
      await fetchData({ status: activeTab.value, searchDebounce, currentPage });
    }
    setLoading("");
  };

  // accept request for staff
  const acceptRequestHandler = async (data) => {
    setLoading("loading");
    const payload = {
      staffSlug: user?.slug,
      status: "in-progress",
      ...(data?.comment && { comment: data?.comment }),
    };
    const { response } = await Patch({
      route: `admin/maintenance-request/approve/reject/${data?.slug}`,
      data: payload,
    });
    if (response) {
      setShowAreYouSureModal(false);
      setModalActionType(null);
      await fetchData({ status: activeTab.value, searchDebounce, currentPage });
      RenderToast({
        type: "success",
        message: t("requestAcceptedSuccessfully"),
      });
    }
    setLoading("");
  };

  useEffect(() => {
    fetchData({ status: activeTab.value, searchDebounce, currentPage });
  }, [activeTab, searchDebounce, currentPage]);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showSearchAndFilter
          showBackBtn
          tabsProps={{
            selected: activeTab,
            setSelected: setActiveTab,
            tabsData,
            disabled: loading === "loading",
          }}
          searchProps={{
            search: search,
            setSearch: (value) => {
              setSearch(value);
              setCurrentPage(1);
            },
          }}
        ></SubHeader>

        <AppTable
          tableHeader={MaintenanceRequestsTableHeader(t)}
          data={tableData}
          actions={tableActions}
          actionStyles={{
            width: "10%",
          }}
          loading={loading === "loading"}
          totalRecords={totalRecords}
          onPageChange={setCurrentPage}
          page={currentPage}
          pagination
          onRowClick={(data) => {
            setSelectedRowData(data);
            setViewDetailModal(true);
          }}
        />
      </Container>
      {viewDetailModal && (
        <MaintenanceRequestDetailModal
          show={viewDetailModal}
          setShow={setViewDetailModal}
          data={selectedRowData}
        />
      )}
      {editModal &&
        permissions.includes("approve-reject-maintenance-request") && (
          <EditMaintenanceRequests
            title={t("assignTaskTitle")}
            show={editModal}
            setShow={setEditModal}
            data={selectedRowData}
            onSave={() =>
              fetchData({
                status: activeTab.value,
                searchDebounce,
                currentPage,
              })
            }
          />
        )}
      {showAreYouSureModal && (
        <AreYouSureModal
          show={showAreYouSureModal}
          setShow={setShowAreYouSureModal}
          loading={loading === "rejecting" || loading === "loading"}
          onConfirm={() => {
            if (modalActionType === "accept") {
              acceptRequestHandler(selectedRowData);
            } else if (modalActionType === "reject") {
              rejectRequestHandler(selectedRowData);
            }
          }}
          onCancel={() => {
            setShowAreYouSureModal(false);
            setModalActionType(null);
          }}
        />
      )}
    </>
  );
}

export function MaintenanceRequestDetailModal({ show, setShow, data }) {
  const t = useTranslations("maintenanceRequestsPage");
  const locale = useLocale();

  return (
    <DetailModal setShow={setShow} title={t("modalTitle")} show={show}>
      <div className={styles.modalMain}>
        <div className={styles.item}>
          <p>{t("table.residentName")}</p>
          <p>{data?.residentName || data?.user?.fullName?.[locale] || "NA"}</p>
        </div>
        <div className={styles.item}>
          <p>{t("table.residentEmail")}</p>
          <p className="lowercase">{data?.user?.email || "NA"}</p>
        </div>

        <div className={styles.item}>
          <p>{t("table.roomNumber")}</p>
          <p>
            {data?.roomNumber ||
              data?.accommodation?.accommodationNumber ||
              "NA"}
          </p>
        </div>
        <div className={styles.item}>
          <p>{t("table.requestDateTime")}</p>
          <p>
            {data?.requestDateTime ||
              moment(data?.createdAt).format("MMMM Do YYYY, h:mm A") ||
              "NA"}
          </p>
        </div>
        <div hidden={!data?.issueCategory} className={styles.item}>
          <p>{t("table.issueCategory")}</p>
          <p>{data?.issueCategory || "NA"}</p>
        </div>
        <div hidden={!data?.category?.severity} className={styles.item}>
          <p>{t("table.risk")}</p>
          <p>{data?.category?.severity || "NA"}</p>
        </div>
        <div className={styles.item}>
          <p>{t("table.shortDescription")}</p>
          <p>{data?.shortDescription || data?.description || "NA"}</p>
        </div>
        <div className={styles.item}>
          <p>{t("table.status")}</p>
          <RenderStatusCell status={data?.status || "NA"} />
        </div>

        <div className={styles.modalImages}>
          <p className={styles.imageTitle}>{t("table.images")}</p>
          <div className={styles.imageGrid}>
            {data?.documents?.map((image, index) => (
              <div key={index.toString()} className={styles.imageItem}>
                <Image
                  src={imageUrl(image)}
                  fill
                  className="c-p"
                  alt={`Image ${index + 1}`}
                  onClick={() => window.open(imageUrl(image), "_blank")}
                />
              </div>
            ))}
          </div>
        </div>

        {data?.assignedTo && (
          <div className={styles.assignedStaffSection}>
            <p className={styles.sectionTitle}>{t("table.assignedStaff")}</p>
            <div className={styles.assignedStaffGrid}>
              <div className={styles.item}>
                <p>{t("table.assignedToName")}</p>
                <p>{data?.assignedTo?.fullName?.[locale] || "NA"}</p>
              </div>
              <div className={styles.item}>
                <p>{t("table.assignedToEmail")}</p>
                <p className="lowercase">{data?.assignedTo?.email || "NA"}</p>
              </div>
              <div className={styles.item}>
                <p>{t("table.assignedToPhone")}</p>
                <p>
                  {data?.assignedTo?.callingCode || ""}{" "}
                  {data?.assignedTo?.phoneNumber || "NA"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DetailModal>
  );
}
