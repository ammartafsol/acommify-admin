"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AddEditHolidayModal from "@/components/organisms/Modals/AddEditHolidayModal";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { LuCalendarDays } from "react-icons/lu";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";

const PAGE_LIMIT = 10;

/** 'YYYY-MM-DD' → local Date (no time-zone shift). */
export const dayToDate = (day) => {
  const [y, m, d] = (day || "").split("-").map(Number);
  return y ? new Date(y, m - 1, d) : null;
};

/** Holidays & bank holidays of the centre (HOL / B/HOL on the staff roster). */
export default function HolidayCrud() {
  const back = useLocaleAwareBack();
  const t = useTranslations("holidaysPage");
  const locale = useLocale();
  const { permissions = [], user } = useSelector((state) => state.authReducer);
  const canEdit =
    ["admin", "business-owner"].includes(user?.role) || permissions.includes("add-edit-holiday");
  const { Get, Delete } = useAxios();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const typeOptions = [
    { label: t("filters.allTypes"), value: "all" },
    { label: t("types.holiday"), value: "holiday" },
    { label: t("types.bank-holiday"), value: "bank-holiday" },
  ];
  const [type, setType] = useState(typeOptions[0]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  // Not "loading" on first render: AppTable must mount its body first (grab-scroll hook)
  const [loading, setLoading] = useState("");
  const [modal, setModal] = useState(null); // { data } for add/edit
  const [deleteRow, setDeleteRow] = useState(null);
  const requestId = useRef(0);

  async function getData(_page = page) {
    const current = ++requestId.current;
    setLoading("loading");
    const params = new URLSearchParams({
      year: String(year),
      type: type?.value || "all",
      page: String(_page),
      limit: String(PAGE_LIMIT),
    });
    const { response } = await Get({ route: `holidays/all?${params}` });
    if (current !== requestId.current) return;
    if (response) {
      setData(Array.isArray(response.data) ? response.data : []);
      setTotalRecords(response.totalRecords || 0);
    }
    setLoading("");
  }

  useEffect(() => {
    setPage(1);
    getData(1);
  }, [year, type?.value]);

  async function deleteHoliday() {
    setLoading("delete");
    const { response } = await Delete({ route: `holidays/${deleteRow._id}` });
    if (response) {
      RenderToast({ type: "success", message: t("toast.deleted") });
      setDeleteRow(null);
      getData(page);
    }
    setLoading("");
  }

  const tableHeader = [
    {
      key: "name",
      title: t("table.name"),
      style: { width: "34%" },
      renderItem: ({ data: row }) => (
        <p className={styles.name}>{row?.name?.[locale] || row?.name?.en || "-"}</p>
      ),
    },
    {
      key: "date",
      title: t("table.date"),
      style: { width: "26%" },
      renderItem: ({ data: row }) => {
        const d = dayToDate(row.date);
        return (
          <div className={styles.dateCell}>
            <span className={styles.dateBadge}>
              <b>{d?.toLocaleDateString(locale, { month: "short" })}</b>
              <strong>{d?.getDate()}</strong>
            </span>
            <span>
              {d?.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        );
      },
    },
    {
      key: "type",
      title: t("table.type"),
      style: { width: "22%" },
      renderItem: ({ data: row }) => (
        <span className={mergeClass(styles.typeBadge, styles[`type_${row.type}`])}>
          <b>{row.type === "bank-holiday" ? "B/HOL" : "HOL"}</b>
          {t(`types.${row.type}`)}
        </span>
      ),
    },
    {
      key: "status",
      title: t("table.status"),
      style: { width: "12%" },
      renderItem: ({ data: row }) => <RenderStatusCell status={row.status} />,
    },
  ];

  const actions = canEdit
    ? [
        {
          renderItem: ({ data: row }) => (
            <MenuComponent
              portal
              items={[
                {
                  title: t("edit"),
                  onClick: () => setModal({ data: row }),
                  style: { color: "var(--Black)", fontWeight: 500 },
                },
                {
                  title: t("delete"),
                  onClick: () => setDeleteRow(row),
                  style: { color: "var(--Red)", fontWeight: 500 },
                },
              ]}
              menuButton={
                <TbDotsVertical
                  color="#B2B5BA"
                  onClick={(e) => e.stopPropagation()}
                  className="pointer"
                  size={20}
                  aria-label={t("actions")}
                />
              }
              value={row}
            />
          ),
        },
      ]
    : [];

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader
        title={t("title")}
        showBackBtn
        handleBack={() => back()}
        buttonProps={
          canEdit
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
                onClick: () => setModal({ data: null }),
              }
            : undefined
        }
      />

      <p className={styles.subtitle}>{t("subtitle")}</p>

      <div className={styles.toolbar}>
        <div className={styles.yearSelector}>
          <button type="button" onClick={() => setYear((y) => y - 1)} aria-label={t("filters.previousYear")}>
            <IoChevronBack size={16} className={styles.flipRtl} />
          </button>
          <span>
            <LuCalendarDays size={16} />
            {year}
          </span>
          <button type="button" onClick={() => setYear((y) => y + 1)} aria-label={t("filters.nextYear")}>
            <IoChevronForward size={16} className={styles.flipRtl} />
          </button>
        </div>
        <div className={styles.typeFilter}>
          <DropDown
            options={typeOptions}
            value={type}
            setValue={(val) => setType(val || typeOptions[0])}
            isSearchable={false}
            isPortal
          />
        </div>
      </div>

      <AppTable
        tableHeader={tableHeader}
        data={data}
        actions={actions}
        loading={loading === "loading"}
        pagination={totalRecords > PAGE_LIMIT}
        page={page}
        totalRecords={totalRecords}
        onPageChange={(p) => {
          setPage(p);
          getData(p);
        }}
      />

      {modal && (
        <AddEditHolidayModal
          show={!!modal}
          setShow={() => setModal(null)}
          modalData={modal.data}
          holidays={data}
          onSave={() => getData(page)}
        />
      )}

      {deleteRow && (
        <AreYouSureModal
          show={!!deleteRow}
          setShow={() => setDeleteRow(null)}
          loading={loading === "delete"}
          message={t("confirmDelete", {
            name: deleteRow?.name?.[locale] || deleteRow?.name?.en || "",
          })}
          onConfirm={deleteHoliday}
        />
      )}
    </Container>
  );
}
