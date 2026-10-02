"use client";
import NoDataFound from "@/components/atoms/NoDataFound/NoDataFound";
import RenderToast from "@/components/atoms/RenderToast";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { OrderDetailTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { ReactSVG } from "react-svg";
import classes from "./styles.module.css";
import { useSelector } from "react-redux";

export default function OrderDetail({ orderId }) {
  const t = useTranslations("orderDetailsPage");
  const { Get, Patch } = useAxios();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(false);
  const [updatingItemSlug, setUpdatingItemSlug] = useState(null);
  const [order, setOrder] = useState(null);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [rowData, setRowData] = useState(null);
  const { permissions } = useSelector((state) => state.authReducer);
  
  const tableActions = [
    {
      renderItem: ({ data }) => (
        <div className={classes.actionsMain}>
          <div
            className={classes.tableIcon}
            onClick={() => {
              setRowData(data);
              if (
                updatingItemSlug !== data?.id &&
                data?.status !== "completed"
              ) {
                setShowAreYouSureModal(true);
              }
            }}
            style={{
              cursor:
                updatingItemSlug === data?.id ||
                data?.status === "completed" ||
                data?.status === "cancelled"
                  ? "not-allowed"
                  : "pointer",
              opacity:
                updatingItemSlug === data?.id ||
                data?.status === "completed" ||
                data?.status === "cancelled"
                  ? 0.5
                  : 1,
            }}
          >
            <ReactSVG
              src="/svg/approved.svg"
              style={{
                cursor:
                  updatingItemSlug === data?.id ||
                  data?.status === "completed" ||
                  data?.status === "cancelled"
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  updatingItemSlug === data?.id ||
                  data?.status === "completed" ||
                  data?.status === "cancelled"
                    ? 0.5
                    : 1,
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  const fetchOrderDetail = async ({ orderId }) => {
    setLoading("loading");
    const { response } = await Get({ route: `admin/order/detail/${orderId}` });
    if (response) {
      const order = response.data;
      setOrder(order);

      const formattedItems = order?.items?.map((item, index) => ({
        index: index + 1,
        id: item?._id,
        slug: item?.product?.slug,
        productName: item?.product?.name?.[locale] || item.product?.name?.en,
        categoryName:
          item.product?.category?.name?.[locale] ||
          item.product?.category?.name?.en,
        quantity: item?.quantity,
        totalPoints: item?.totalPoints,
        shippingOption: item?.shippingOption,
        status: item?.status,
      }));

      setTableData(formattedItems);
    }
    setLoading("");
  };

  const updateOrderItemStatus = async (itemSlug, status) => {
    setLoading("updating");
    const { response } = await Patch({
      route: `admin/order/item/status/update/${orderId}`,
      data: { itemId: itemSlug, status: status },
    });
    if (response) {
      RenderToast({
        type: "success",
        message: t("completedStatusToast"),
      });
      await fetchOrderDetail({ orderId });
    }
    setLoading("");
  };

  useEffect(() => {
    fetchOrderDetail({ orderId });
  }, []);

  if (loading === "loading" || loading === "updating") {
    return (
      <Container
        className={mergeClass(
          "containerFluid",
          classes.main,
          classes.spinnerContainer
        )}
      >
        <SpinnerLoading animation="border" />
      </Container>
    );
  }

  if (!order) {
    return <NoDataFound />;
  }

  const { user, totalPoints, status, createdAt } = order;

  return (
    <Container className={mergeClass("containerFluid")}>
      <div className={classes.main}>
        <SubHeader title={t("title")} showBackBtn />
        <div className={classes.header}>
          <div className={classes.headerLeft}>
            <h2>
              {t("orderDetail.orderId")} #{order.orderId}
            </h2>
            <div className={classes.metaRow}>
              <div className={classes.metaItem}>
                <span className={classes.metaLabel}>
                  {t("orderDetail.status")}
                </span>
                <span className={classes.metaValue}>
                  <RenderStatusCell status={status} />
                </span>
              </div>
              <div className={classes.metaItem}>
                <span className={classes.metaLabel}>
                  {t("orderDetail.orderDate")}
                </span>
                <span className={classes.metaValue}>
                  {new Date(createdAt).toLocaleString()}
                </span>
              </div>
              <div className={classes.metaItem}>
                <span className={classes.metaLabel}>
                  {t("orderDetail.totalPoints")}
                </span>
                <span className={classes.metaValueHighlight}>
                  {totalPoints}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={classes.grid}>
          <div className={classes.col}>
            <div className={classes.card}>
              <div className={classes.cardTitle}>
                {t("orderDetail.userInfo")}
              </div>
              <div className={classes.cardHeader}>
                <div className={classes.titleHeading}>
                  <span>{t("orderDetail.name")}</span>
                </div>
                <div className={classes.country}>
                  <p>
                    {" "}
                    {user?.fullName?.[locale] || user?.fullName?.en || "N/A"}
                  </p>
                </div>

                <div className={classes.titleHeading}>
                  <span>{t("orderDetail.email")}</span>
                </div>
                <div className={classes.country}>
                  <p>{user?.email}</p>
                </div>

                <div className={classes.titleHeading}>
                  <span>Room Number</span>
                </div>
                <div className={classes.country}>
                  <p>{user?.accommodation?.accommodationNumber}</p>
                </div>

                <div className={classes.titleHeading}>
                  <span>{t("orderDetail.phone")}</span>
                </div>
                <div className={classes.country}>
                  <p>
                    {user?.callingCode} {user?.phoneNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className={mergeClass(classes.col, classes.summaryCol)}>
            <div className={classes.cardAccent}>
              <div className={classes.cardTitleRow}>
                <div className={classes.cardTitle}>
                  {t("orderDetail.summary")}
                </div>
                <RenderStatusCell status={status} />
              </div>
              <div className={classes.summaryRow}>
                <span>{t("orderDetail.orderIdLabel")}</span>
                <strong>#{order.orderId}</strong>
              </div>
              <div className={classes.summaryRow}>
                <span>{t("orderDetail.items")}</span>
                <strong>{order?.items?.length || 0}</strong>
              </div>
              <div className={classes.divider} />
              <div className={classes.summaryTotal}>
                <span>{t("orderDetail.totalPoints")}</span>
                <strong>{totalPoints}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={classes.orderItem}>
          <p> {t("orderDetail.orderItem")}</p>
          <AppTable
            tableHeader={OrderDetailTableHeader(t)}
            data={tableData}
            loading={loading === "loading"}
            actions={ permissions.includes("edit-order") && tableActions}
            actionStyles={ permissions.includes("edit-order") ? { width: "10%" } : { width: "0%" }}
            tableMinWidth={1100}
          />
        </div>
      </div>
      {showAreYouSureModal && (
        <AreYouSureModal
          show={showAreYouSureModal}
          setShow={setShowAreYouSureModal}
          loading={loading === "updating"}
          message="Are you sure you want to mark this item as completed?"
          onConfirm={async () => {
            setShowAreYouSureModal(false);
            setLoading("updating");
            await updateOrderItemStatus(rowData?.id, "completed");
          }}
        />
      )}
    </Container>
  );
}
