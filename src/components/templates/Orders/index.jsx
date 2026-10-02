"use client";
import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import DateRangeModal from "@/components/organisms/Modals/DateRangeModal/DateRangeModal";
import config from "@/config";
import { useRouter } from "@/i18n/navigation";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { OrdersManagementTableHeader } from "@/resources/utils/tableHeaders";
import axios from "axios";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import classes from "./styles.module.css";

export default function OrdersTemplate() {
  const { accessToken } = useSelector((state) => state.authReducer);
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("ordersPage");
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const tabsData = [
    {
      label: t("ordersTabs.all"),
      value: "all",
    },
    {
      label: t("ordersTabs.pending"),
      value: "pending",
    },

    {
      label: t("ordersTabs.cancelled"),
      value: "cancelled",
    },
    {
      label: t("ordersTabs.completed"),
      value: "completed",
    },
  ];
  const router = useRouter();
  const { Get, Patch, Post } = useAxios();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  // const locale = useLocale();
  const [search, setSearch] = useState("");
  const [rowData, setRowData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(tabsData[0]);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const searchDebounce = useDebounce(search, 500);
  const tableActions = [
    {
      renderItem: ({ data }) => (
        <div className={classes.actionsMain}>
          {/* {permissions.includes("edit-order") && ( */}
          <div
            className={classes.tableIcon}
            onClick={() => {
              if (
                cancellingOrderId !== data?.slug &&
                data?.status?.toLowerCase() !== "cancelled" &&
                data?.status?.toLowerCase() !== "completed"
              ) {
                setRowData(data);
                setShowAreYouSureModal(true);
              }
            }}
            style={{
              cursor:
                cancellingOrderId === data?.slug ||
                data?.status?.toLowerCase() === "cancelled" ||
                data?.status?.toLowerCase() === "completed"
                  ? "not-allowed"
                  : "pointer",
              opacity:
                cancellingOrderId === data?.slug ||
                data?.status?.toLowerCase() === "cancelled" ||
                data?.status?.toLowerCase() === "completed"
                  ? 0.5
                  : 1,
            }}
          >
            <ReactSVG src="/svg/close.svg" />
          </div>
          {/* // )} */}
        </div>
      ),
    },
  ];

  const cancelOrderHandler = async (orderId) => {
    setCancellingOrderId("cancelling");
    const { response } = await Patch({
      route: `admin/order/cancel/${orderId}`,
    });
    if (response) {
      RenderToast({
        type: "success",
        message: t("cancelOrderToast"),
      });
      setRowData(null);
      await fetchOrders({ page: 1, selectedTab, searchDebounce });
    }
    setCancellingOrderId("");
  };

  const exportOrdersHandler = async (dateRange) => {
    setLoading("exporting");
    const query = {
      startDate: moment(dateRange.startDate).format("YYYY-MM-DD"),
      endDate: moment(dateRange.endDate).format("YYYY-MM-DD"),
      format: "excel",
    };

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/api/v1/admin/order/export`,
        query,
        {
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, */*",
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      if (response.data) {
        console.log(response.data, "export response");

        // Create blob for download
        const blob = new Blob([response.data], {
          type:
            response.headers["content-type"] ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `orders_${moment().format("YYYY-MM-DD")}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        RenderToast({
          type: "success",
          message: t("exportSuccessToast"),
        });
        setShowDateRangeModal(false);
      }
    } catch (error) {
      console.error("Export error:", error);
      RenderToast({
        type: "error",
        message: t("exportErrorToast"),
      });
    }
    setLoading("");
  };

  const fetchOrders = async ({ page, selectedTab, searchDebounce }) => {
    setLoading("loading");
    const query = {
      page: page,
      limit: 10,
      status: selectedTab.value,
      search: searchDebounce,
    };

    const queryString = new URLSearchParams(query).toString();

    const { response } = await Get({ route: `admin/order/all?${queryString}` });

    if (response) {
      const formattedData = response.data.map((order) => ({
        id: order?._id,
        slug: order?.slug,
        orderId: order?.orderId,
        customerName: order?.shippingDetail?.fullName || "N/A",
        orderDate: moment(order?.createdAt).format("YYYY-MM-DD") || "N/A",
        totalPoints: order?.totalPoints || 0,
        status: order?.status || "N/A",
      }));
      setData(formattedData);
      setTotalRecords(response.totalRecords);
    }
    setLoading("");
  };

  useEffect(() => {
    fetchOrders({ page: 1, selectedTab, searchDebounce });
  }, [selectedTab, searchDebounce]);

  return (
    <div className={classes.container}>
      <Container className="containerFluid">
        <SubHeader
          showBackBtn
          title={t("title")}
          tabsProps={{
            tabsData,
            selected: selectedTab,
            setSelected: setSelectedTab,
          }}
          searchAndFilterAtTop={false}
          showSearchAndFilter
          searchProps={{
            placeholder: t("searchPlaceholder"),
            search: search,

            setSearch: (s) => {
              setSearch(s);
              setCurrentPage(1);
            },
          }}
          buttonProps={{
            label: t("exportButtonLabel"),
            variant: "primary",
            onClick: () => {
              setShowDateRangeModal(true);
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
          }}
        />

        <div className={classes.tableMain}>
          <AppTable
            rowClassName="cursorPointer"
            tableHeader={OrdersManagementTableHeader(t)}
            actions={ permissions.includes("edit-order") && tableActions}
            actionStyles={ permissions.includes("edit-order") ? {
              width: "19%",
            } : {
              width: "0%",
            }}
            data={data}
            pagination
            loading={loading}
            page={currentPage}
            onRowClick={(row) => {
              router.push(`/orders/order-detail/${row?.slug}`);
            }}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchOrders({ page, selectedTab, searchDebounce });
            }}
            totalRecords={totalRecords}
          />
        </div>
      </Container>
      {showAreYouSureModal && (
        <AreYouSureModal
          show={showAreYouSureModal}
          setShow={setShowAreYouSureModal}
          loading={loading === "cancelling"}
          message="Are you sure you want to cancel this order?"
          onConfirm={async () => {
            setShowAreYouSureModal(false);
            setLoading("cancelling");
            await cancelOrderHandler(rowData?.slug);
          }}
        />
      )}

      {showDateRangeModal && (
        <DateRangeModal
          show={showDateRangeModal}
          setShow={setShowDateRangeModal}
          title={t("exportDateRangeTitle")}
          loading={loading === "exporting"}
          onApply={exportOrdersHandler}
        />
      )}
    </div>
  );
}
