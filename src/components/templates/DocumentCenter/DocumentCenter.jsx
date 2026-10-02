"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditDocumentModal from "@/components/organisms/Modals/AddEditDocumentModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import useDirection from "@/resources/hooks/useDirection";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { mergeClass } from "@/resources/utils/helper";
import { DocumentsTableHeader } from "@/resources/utils/tableHeaders";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import useDimensions from "@/resources/hooks/useDimensions";

export default function DocumentCenter() {
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("documentCenterPage");
  const {width} = useDimensions();
  const isMobile = width < 576;
  const { Get } = useAxios();
  const locale = useLocale();
  const dir = useDirection();
  const [show, setShow] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState("");
  const [documentsData, setDocumentsData] = useState();
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const menuItems = [
    {
      title: t("actions.edit"),
      onClick: (data) => {
        setModalData(data?.value);
        setShow(true);
      },
      style: {
        color: "var(--Black)",
        fontWeight: 500,
      },
    },
  ];

  const tableActions = permissions.includes("add-edit-document")
    ? [
        {
          renderItem: ({ data }) => (
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
              value={data}
            />
          ),
        },
      ]
    : [];

  async function getDocumentsData({ _search = search, _page = page } = {}) {
    const params = new URLSearchParams({
      search: _search?.trim(),
      page: _page,
      limit: RECORDS_LIMIT,
    });
    setLoading("loading");
    const { response } = await Get({
      route: `admin/document-center/all?${params.toString()}`,
    });

    if (response) {
      setDocumentsData(response?.data || []);
      setTotalRecords(response?.totalRecords || 0);
    }
    setLoading("");
  }

  useEffect(() => {
    if (permissions.includes("view-documents")) {
      getDocumentsData({ _search: debounceSearch, _page: 1 });
      setPage(1);
    }
  }, [debounceSearch]);

  useEffect(() => {
    if (modalData && !show) {
      setModalData(null);
    }
  }, [show]);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showSearchAndFilter
          showBackBtn={isMobile ? true : false}
          searchAndFilterAtTop
          buttonProps={
            permissions?.includes("add-edit-document")
              ? {
                  label: t("addDocument"),
                  variant: "primary",
                  onClick: () => setShow(true),
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
          searchProps={{
            search: search,
            setSearch: setSearch,
            placeholder: t("searchPlaceholder"),
            dir: dir,
          }}
        />

        <AppTable
          loading={loading === "loading"}
          tableHeader={DocumentsTableHeader(t, locale)}
          data={documentsData}
          actions={tableActions}
          actionStyles={{
            width: "10%",
          }}
          pagination
          page={page}
          onPageChange={(p) => {
            setPage(p);
            getDocumentsData({ _page: p, _search: debounceSearch });
          }}
          totalRecords={totalRecords}
        />
      </Container>

      {show && (
        <AddEditDocumentModal
          show={show}
          setShow={setShow}
          modalData={modalData}
          onSubmit={() => getDocumentsData({ _page: 1, _search: "" })}
          setModalData={setModalData}
        />
      )}
    </>
  );
}
