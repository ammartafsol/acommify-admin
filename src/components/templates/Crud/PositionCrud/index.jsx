"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditPositionsModal from "@/components/organisms/Modals/AddEditPositionsModal";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { PositionsTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";

export default function PositionCrud() {
  const back = useLocaleAwareBack();
  const t = useTranslations("positionPage");
  const { permissions } = useSelector((state) => state.authReducer);
  const { Get, Patch } = useAxios();
  const locale = useLocale();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState("");
  const [modalData, setModalData] = useState(null);
  const [page, setPage] = useState(1);
  const [ShowAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [data, setData] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);

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
        setDeleteRow(data);
        // setLoading(false);
      },
      style: {
        color: "var(--Red)",
        fontWeight: 500,
      },
    },
  ];

  const TableActions = permissions.includes("add-edit-position")
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

  async function getPositionsData() {
    setLoading("loading");

    const { response } = await Get({
      route: `admin/position/all`,
    });

    if (response) {
      setData(response?.data);
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  async function deletePosition(row) {
    if (!row?.slug) return;
    setLoading("delete");

    const { response } = await Patch({
      route: `admin/position/update/${row?.slug}`,
      data: { status: "deleted" },
    });

    if (response) {
      setShowAreYouSureModal(false);
      setDeleteRow(null);
      getPositionsData();
    }

    setLoading("");
  }

  useEffect(() => {
    getPositionsData();
  }, []);

  useEffect(() => {
    if (!show) {
      setModalData(null);
    }
  }, [show]);

  const handleSave = () => {
    setModalData(null);
    getPositionsData();
  };

  const handleCloseModal = () => {
    if (loading === "loading") return;
    setModalData(null);
    setShow(false);
  };

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader
        title={t("title")}
        showBackBtn
        handleBack={() => {
          back();
        }}
        buttonProps={
          permissions.includes("add-edit-position")
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
        tableHeader={PositionsTableHeader(t, locale)}
        data={data}
        actions={TableActions}
        pagination
        page={page}
        loading={loading === "loading"}
        onPageChange={(p) => {
          setPage(p);
          getPositionsData({ _page: p });
        }}
        totalRecords={totalRecords}
      />

      {show && (
        <AddEditPositionsModal
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
          onConfirm={() => deletePosition(deleteRow)}
        />
      )}
    </Container>
  );
}
