"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditFaqsModal from "@/components/organisms/Modals/AddEditFaqModal";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { capitalizeEachWord, mergeClass } from "@/resources/utils/helper";
import { FAQsTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";

export default function FAQs() {
  const t = useTranslations("faqPage");
  const { permissions } = useSelector((state) => state.authReducer);
  const { Get, Patch } = useAxios();
  const locale = useLocale();
  const back = useLocaleAwareBack();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState("");
  const [modalData, setModalData] = useState(null);
  const [page, setPage] = useState(1);
  const [ShowAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [data, setData] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  const TableActions = permissions.includes("add-edit-faq")
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

  async function getFaqsData() {
    setLoading("loading");

    const { response } = await Get({
      route: `admin/faqs/all`,
    });

    if (response) {
      setData(response?.data);
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  async function deleteFaq(row) {
    if (!row?.slug) return;
    setLoading("delete");

    const { response } = await Patch({
      route: `admin/faqs/update/${row?.slug}`,
      data: { status: "deleted" },
    });

    if (response) {
      setShowAreYouSureModal(false);
      setDeleteRow(null);
      getFaqsData();
    }

    setLoading("");
  }

  useEffect(() => {
    getFaqsData();
  }, []);

  useEffect(() => {
    if (!show) {
      setModalData(null);
    }
  }, [show]);

  const handleSave = () => {
    setModalData(null);
    getFaqsData();
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
          permissions.includes("add-edit-faq")
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
        tableHeader={FAQsTableHeader(t, locale)}
        data={data}
        actions={TableActions}
        pagination
        page={page}
        loading={loading === "loading"}
        onRowClick={(data) => {
          setShowViewModal(true);
          setModalData(data);
        }}
        onPageChange={(p) => {
          setPage(p);
          getFaqsData({ _page: p });
        }}
        totalRecords={totalRecords}
      />

      {show && (
        <AddEditFaqsModal
          t={t}
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
          onConfirm={() => deleteFaq(deleteRow)}
        />
      )}
      {showViewModal && (
        <DetailModal
          show={showViewModal}
          setShow={setShowViewModal}
          title={t("viewModalTitle")}
        >
          <div className={styles.modalMain}>
            <div className={styles.item}>
              <p>{t("questionTitle")}</p>
              <p>{modalData?.title?.[locale] || "N/A"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("answerTitle")}</p>
              <p>{modalData?.description?.[locale] || "N/A"}</p>
            </div>

            <div className={styles.item}>
              <p>{t("statusTitle")}</p>
              <div
                className={
                  modalData?.status === "active"
                    ? styles.active
                    : styles.inactive
                }
              >
                <span></span>
                <p>{capitalizeEachWord(modalData?.status)}</p>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </Container>
  );
}
