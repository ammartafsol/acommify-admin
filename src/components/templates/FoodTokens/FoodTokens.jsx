"use client";

import Button from "@/components/atoms/Button";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditFoodTokenModal from "@/components/organisms/Modals/AddEditFoodTokenModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { FoodTokensTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";

export default function FoodTokens() {
  const { permissions } = useSelector((state) => state.authReducer);
  // console.log("permissions", permissions);
  const { Get } = useAxios();
  const [show, setShow] = useState(false);
  const [data, setData] = useState();
  const [modalData, setModalData] = useState(null);
  const [search, setSearch] = useState("");
  const locale = useLocale();
  const debounceSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState("");
  const [activeLanguage, setActiveLanguage] = useState(locale);
  const t = useTranslations("foodTokensPage");

  const tableActions = permissions.includes("add-food-token")
    ? [
        {
          renderItem: ({ data }) => (
            <Button
              variant="primary"
              leftIcon={<ReactSVG src="/svg/plus.svg" className="reactSvg" />}
              label={t("modal.editFoodToken")}
              className={styles.addTokensBtn}
              onClick={(e) => {
                setModalData(data);
                setShow(true);
                e.stopPropagation();
              }}
            />
          ),
        },
      ]
    : [];

  const handleSave = () => {
    setModalData(null);
    getData();
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
      let modifiedData = response?.data?.map((item) => ({
        ...item,
        residentName: item?.user?.fullName[activeLanguage] || "-",
        roomNo: item?.user?.accommodation?.accommodationNumber || "-",
        email: item?.user?.email || "-",
        phoneNumber: item?.user?.phoneNumber || "-",
        callingCode: item?.user?.callingCode || "-",
        availableToken: item?.availableTokens || "-",
        slug: item?.user?.slug,
        userSlug: item?.slug,
      }));
      setData(modifiedData);
      console.log(modifiedData, "modifiedData");
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  useEffect(() => {
    getData({ _search: debounceSearch, _page: 1 });
  }, [debounceSearch]);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader
        title={t("title")}
        showSearchAndFilter
        searchAndFilterAtTop
        searchProps={{
          search: search,
          setSearch: (s) => {
            setSearch(s);
            setPage(1);
          },
        }}
        buttonProps={
          permissions.includes("view-residents") &&
          permissions.includes("add-food-token")
            ? {
                label: t("modal.addFoodToken"),
                variant: "primary",
                onClick: () => (setShow(true), setModalData(null)),
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
              }
            : undefined
        }
      />
      <AppTable
        tableHeader={FoodTokensTableHeader(t)}
        data={data}
        actions={tableActions}
        actionStyles={{
          width: "15%",
        }}
        loading={loading === "loading"}
        totalRecords={totalRecords}
        page={page}
        onPageChange={(p) => {
          setPage(p);
          getData({ _page: p });
        }}
        pagination
      />
      {show && (
        <AddEditFoodTokenModal
          show={show}
          setShow={setShow}
          data={modalData}
          onSave={handleSave}
        />
      )}
    </Container>
  );
}
