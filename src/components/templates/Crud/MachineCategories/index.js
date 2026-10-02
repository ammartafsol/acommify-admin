"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditMachineCategoriesModal from "@/components/organisms/Modals/AddEditMachineCategoriesModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { MachineCategoriesTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";

export default function MachineCategories() {
  const locale = useLocale();

  const t = useTranslations("crudPage.laundaryMachineCategoriesPage");
  const { permissions } = useSelector((state) => state.authReducer);
  const back = useLocaleAwareBack();

  const [show, setShow] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [modalData, setModalData] = useState(null);
  const { Get } = useAxios();
  const [data, setData] = useState();
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState("");

  const menuItems = [
    {
      title: t("edit"),
      onClick: (data) => {
        setModalData(data);
        setShow(true);
      },
      style: {
        color: "var(--Black)",
        fontWeight: 500,
      },
    },
  ];

  const tableActions = permissions.includes("add-edit-machine")
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

  const handleSave = () => {
    setModalData(null);
    getData();
  };

  const handleCloseModal = () => {
    if (loading === "loading") return;
    setModalData(null);
    setShow(false);
  };

  async function getData({ _search = search, _page = page } = {}) {
    setLoading("loading");
    const params = new URLSearchParams({
      search: _search?.trim(),
      page: _page,
      limit: 10,
    });

    const { response } = await Get({
      route: `admin/machine/all?${params.toString()}`,
    });

    if (response?.status === "success") {
      setData(response?.data);
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  useEffect(() => {
    getData({ _search: debounceSearch, _page: 1 });
  }, [debounceSearch, page]);

  useEffect(() => {
    if (!show && !showDetail) {
      setModalData(null);
    }
  }, [show, showDetail]);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showSearchAndFilter
          handleBack={() => {
            back();
          }}
          searchAndFilterAtTop
          showBackBtn
          buttonProps={
            permissions.includes("add-edit-machine")
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
          searchProps={{
            search,
            setSearch,
          }}
        />
        <AppTable
          tableHeader={MachineCategoriesTableHeader(t, locale)}
          data={data}
          actions={tableActions}
          actionStyles={{
            width: "10%",
          }}
          onRowClick={(data) => {
            setModalData(data);
            setShowDetail(true);
          }}
          pagination
          page={page}
          onPageChange={(p) => {
            setPage(p);
            getData({ _page: p, _search: debounceSearch });
          }}
          totalRecords={totalRecords}
          loading={loading}
        />
      </Container>

      {show && (
        <AddEditMachineCategoriesModal
          show={show}
          setShow={handleCloseModal}
          data={modalData}
          onSave={handleSave}
        />
      )}
    </>
  );
}
