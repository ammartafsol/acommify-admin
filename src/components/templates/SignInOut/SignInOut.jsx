"use client";

import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { capitalizeEachWord, mergeClass } from "@/resources/utils/helper";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import styles from "./styles.module.css";

export default function SignInOut() {
  const t = useTranslations("signInOutPage");
  const locale = useLocale();
  const { Get } = useAxios();

  const [search, setSearch] = useState("");
  const searchDebounce = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async ({ searchValue, pageValue }) => {
    const query = {
      page: pageValue,
      limit: RECORDS_LIMIT,
    };

    if (searchValue) {
      query.search = searchValue;
    }

    const queryParams = new URLSearchParams(query).toString();
    setLoading(true);
    const { response } = await Get({
      route: `admin/accommodation/checkin-checkout/logs?${queryParams}`,
    });

    if (response) {
      setTableData(response.data || []);
      setTotalRecords(response.totalRecords || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchData({ searchValue: searchDebounce, pageValue: 1 });
  }, [searchDebounce]);

  const tableHeader = useMemo(
    () => [
      {
        key: "residentName",
        title: t("table.residentName"),
        style: { width: "25%", textTransform: "capitalize" },
        renderItem: ({ data }) =>
          capitalizeEachWord(data?.user?.fullName?.[locale] || "NA"),
      },
      {
        key: "accommodationNumber",
        title: t("table.accommodationNumber"),
        style: { width: "20%", textTransform: "capitalize" },
        renderItem: ({ data }) =>
          data?.accommodation?.accommodationNumber || "N/A",
      },
      {
        key: "type",
        title: t("table.type"),
        style: { width: "15%", textTransform: "capitalize" },
        renderItem: ({ data }) =>
          data?.checkOut ? t("typeLabel.signOut") : t("typeLabel.signIn"),
      },
      {
        key: "createdAt",
        title: t("table.dateTime"),
        style: { width: "25%" },
        renderItem: ({ item }) =>
          item ? moment(item).format("DD MMM, YYYY • hh:mm A") : "NA",
      },
    ],
    [t, locale]
  );

  return (
    <Container className={mergeClass("containerFluid", styles.signInOut)}>
      <SubHeader
        title={t("title")}
        showBackBtn
        showSearchAndFilter
        searchProps={{
          search,
          setSearch: (value) => {
            setSearch(value);
          },
          className: styles.searchInput,
          placeholder: t("searchPlaceholder"),
        }}
      />

      <AppTable
        tableHeader={tableHeader}
        data={tableData}
        loading={loading}
        pagination
        page={page}
        totalRecords={totalRecords}
        tableMinWidth="900px"
        onPageChange={(p) => {
          setPage(p);
          fetchData({ pageValue: p, searchValue: searchDebounce });
        }}
      />
    </Container>
  );
}
