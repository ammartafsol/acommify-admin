"use client";
import { mergeClass } from "@/resources/utils/helper";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import classes from "./styles.module.css";
import { ReactSVG } from "react-svg";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import useAxios from "@/interceptor/axios-functions";
import AddEditHelpLineModal from "@/components/organisms/Modals/AddEditHelpLineModal/AddEditHelpLineModal";
import { HelpLineCardsTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { TbDotsVertical } from "react-icons/tb";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { useSelector } from "react-redux";

export default function HelpLineCardPage() {
  const { permissions } = useSelector((state) => state.authReducer);
  console.log("permissions", permissions);
  const t = useTranslations("crudPage.helpLineCrudPage");
  const { Get, Patch } = useAxios();
  const [show, setShow] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState("");
  const locale = useLocale();
  const [tableData, setTableData] = useState([]);
  const tableActions = permissions.includes("add-edit-help-line")
    ? [
        {
          renderItem: ({ data }) => {
            const menuItems = [
              {
                title:
                  data.status === "active"
                    ? t("actions.inactive")
                    : t("actions.active"),
                onClick: () => {
                  const newStatus =
                    data.status === "active" ? "inactive" : "active";
                  handleStatusChange(data?.slug, newStatus);
                },
                style: {
                  color: "var(--Black)",
                  fontWeight: 500,
                },
              },
            ];

            return (
              <div className={classes.actionsMain}>
                <div
                  className={classes.tableIcon}
                  onClick={() => {
                    setModalData(data);
                    setShow(true);
                  }}
                >
                  <ReactSVG src="/svg/edit.svg" />
                </div>

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
                  value={data?.slug}
                />
              </div>
            );
          },
        },
      ]
    : [];

  const getAllHelpLines = async () => {
    setLoading("loading");
    const res = await Get({ route: "admin/help-line/all" });
    if (res) {
      const formattedData = res?.response?.data?.map((item) => ({
        ...item,
        phoneNumber: item?.phoneNumber || "NA",
        timings: item?.timings || "NA",
        callingCode: item?.callingCode || "NA",
        status: item?.status || "NA",
      }));
      setTableData(formattedData);
    }
    setLoading("");
  };

  const handleStatusChange = async (slug, newStatus) => {
    setLoading("loading");
    const { response } = await Patch({
      route: `admin/help-line/update/${slug}`,
      data: { status: newStatus },
    });
    if (response) {
      await getAllHelpLines();

      RenderToast({
        type: "success",
        message: t("toasts.statusUpdateSuccess"),
      });
    }
    setLoading("");
  };

  useEffect(() => {
    getAllHelpLines();
  }, []);
  return (
    <Container className={mergeClass("containerFluid", classes.main)}>
      <SubHeader
        title={t("title")}
        showBackBtn
        buttonProps={
          permissions.includes("add-edit-help-line")
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
        loading={loading}
        tableHeader={HelpLineCardsTableHeader(t, locale)}
        data={tableData}
        pagination
        actions={tableActions}
        actionStyles={{
          width: "15%",
        }}
      />

      {show && (
        <AddEditHelpLineModal
          show={show}
          setShow={setShow}
          data={modalData}
          onSave={getAllHelpLines}
          t={t}
        />
      )}
    </Container>
  );
}
