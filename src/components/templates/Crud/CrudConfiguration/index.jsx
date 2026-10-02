"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditConfigurationModal from "@/components/organisms/Modals/AddEditConfigurationModal/AddEditConfigurationModal";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { isAdminOrBusinessOwner, mergeClass } from "@/resources/utils/helper";
import { ConfigurationTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";

export default function CrudConfiguration() {
  const t = useTranslations("configurationPage");
  const { Get, Patch } = useAxios();
  const locale = useLocale();
  const back = useLocaleAwareBack();
  const [ShowAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState("");
  const [modalData, setModalData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [data, setData] = useState("");
  const { user } = useSelector((state) => state.authReducer);

  const hasAccess = isAdminOrBusinessOwner(user?.role);

  const menuItems = [
    {
      title: t("editButton"),
      onClick: (data) => {
        setModalData(data);
        setShow(true);
      },
      style: {
        color: "var(--Black)",
        fontWeight: 500,
      },
    },

    {
      title: t("deleteButton"),
      onClick: (data) => {
        setShowAreYouSureModal(true);
        setModalData(data);
      },
      style: {
        color: "var(--Red)",
        fontWeight: 500,
      },
    },
  ];

  const TableActions = hasAccess
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

  async function getConfigurationsData({ page }) {
    const params = new URLSearchParams({
      page: page,
      limit: 10,
    });
    setLoading("loading");

    const { response } = await Get({
      route: `admin/ip-address/all?${params.toString()}`,
    });

    if (response) {
      setData(response?.data?.data);
      setTotalRecords(response?.data?.totalRecords);
    }
    setLoading("");
  }

  useEffect(() => {
    getConfigurationsData({ page: 1 });
  }, []);

  const handleSave = () => {
    setModalData(null);
    getConfigurationsData({ page });
  };

  const handleCloseModal = () => {
    if (loading === "loading") return;
    setModalData(null);
    setShow(false);
  };

  const deleteHandler = async () => {
    setLoading("delete");
    const { response } = await Patch({
      route: `admin/ip-address/update/${modalData?.slug}`,
      data: {
        status: "deleted",
      },
    });
    if (response) {
      getConfigurationsData({ page: 1 });
      setShowAreYouSureModal(false);
      setModalData(null);
      RenderToast({
        message: t("toast.configurationDeleted"),
        type: "success",
      });
    }
    setLoading("");
  };

  useEffect(() => {
    if (!show) {
      setModalData(null);
    }
    return () => {
      setModalData(null);
    };
  }, [show]);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader
        title={t("title")}
        showBackBtn
        handleBack={() => {
          back();
        }}
        buttonProps={
          hasAccess
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
                  setShow(true);
                },
              }
            : undefined
        }
      />
      <AppTable
        tableHeader={ConfigurationTableHeader(t, locale)}
        data={data}
        actions={TableActions}
        pagination
        page={page}
        loading={loading === "loading"}
        onPageChange={(p) => {
          setPage(p);
          getConfigurationsData({ page: p });
        }}
        totalRecords={totalRecords}
        actionStyles={{
          width: "10%",
        }}
      />

      {show && (
        <AddEditConfigurationModal
          setShow={handleCloseModal}
          show={show}
          onSave={handleSave}
          modalData={modalData}
          setModalData={setModalData}
        />
      )}
      {ShowAreYouSureModal && (
        <AreYouSureModal
          show={ShowAreYouSureModal}
          setShow={setShowAreYouSureModal}
          loading={loading === "delete" ? true : false}
          onConfirm={() => deleteHandler()}
        />
      )}
    </Container>
  );
}
