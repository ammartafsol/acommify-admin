"use client";
import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { Container } from "react-bootstrap";
import AppTable from "@/components/organisms/AppTable/AppTable";
import {
  FoodTokensCrudTableHeader,
  MachineCategoriesTableHeader,
} from "@/resources/utils/tableHeaders";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import { ReactSVG } from "react-svg";
import { TbDotsVertical } from "react-icons/tb";
import MenuComponent from "@/components/atoms/MenuComponent";
import useDebounce from "@/resources/hooks/useDebounce";
import useAxios from "@/interceptor/axios-functions";
import { mergeClass } from "@/resources/utils/helper";
import AddEditFoodTokenModal from "@/components/organisms/Modals/AddEditFoodTokenModal";
import { useLocale } from "next-intl";
export default function FoodTokenCrud() {
  const locale = useLocale();
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
      title: "Edit",
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

  const tableActions = [
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
  ];
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
      route: `admin/food-token/all?${params.toString()}`,
    });

    if (response) {
      setData(response?.data);
      setTotalRecords(response?.totalRecords);
      console.log(response);
    }
    setLoading("");
  }

  useEffect(() => {
    getData({ _search: debounceSearch, _page: 1 });
  }, [debounceSearch, page]);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={"Food Token"}
          showSearchAndFilter
          searchAndFilterAtTop
          buttonProps={{
            label: "Add Food Token",
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
          }}
          searchProps={{
            search,
            setSearch,
          }}
        />
        <AppTable
          tableHeader={FoodTokensCrudTableHeader(locale)}
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
      <AddEditFoodTokenModal
        show={show}
        setShow={handleCloseModal}
        data={modalData}
        onSave={handleSave}
      />
    </>
  );
}
