"use client";

import NoDataFound from "@/components/atoms/NoDataFound/NoDataFound";
import Pagination from "@/components/molecules/Pagination";
import useDirection from "@/resources/hooks/useDirection";
import { useTranslations } from "@/resources/hooks/useTranslations";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CiFilter } from "react-icons/ci";
import { LuChevronRight, LuHouse, LuSearch, LuUser } from "react-icons/lu";
import {
  formatMaintenanceRequest,
  getHouseAndRoom,
  getPriority,
} from "./formatMaintenanceRequest";
import styles from "./mobile.module.css";

function formatListDate(date, t) {
  const value = moment(date);
  if (!value.isValid()) return "";
  const time = value.format("HH:mm");
  if (value.isSame(moment(), "day")) return `${t("mobile.today")}, ${time}`;
  if (value.isSame(moment().subtract(1, "day"), "day")) {
    return `${t("mobile.yesterday")}, ${time}`;
  }
  return value.format("D MMM YYYY, HH:mm");
}

function withLabel(label, value) {
  if (!value || value === "N/A") return "";
  if (String(value).toLowerCase().includes(String(label).toLowerCase())) {
    return value;
  }
  return `${label} ${value}`;
}

export default function MaintenanceRequestsMobile({
  data,
  loading,
  search,
  setSearch,
  activeTab,
  setActiveTab,
  onOpen,
  priority,
  setPriority,
  totalRecords,
  currentPage,
  setCurrentPage,
}) {
  const t = useTranslations("maintenanceRequestsPage");
  const locale = useLocale();
  const dir = useDirection();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const priorities = [
    { value: "all", label: t("tabs.all") },
    { value: "high", label: t("mobile.high") },
    { value: "medium", label: t("mobile.medium") },
    { value: "low", label: t("mobile.low") },
  ];

  useEffect(() => {
    if (!filterOpen) return undefined;

    const close = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filterOpen]);

  const tabs = [
    { value: "all", label: t("tabs.all") },
    { value: "pending", label: t("tabs.pending") },
    { value: "rejected", label: t("tabs.rejected") },
    { value: "completed", label: t("tabs.completed") },
    { value: "escalated", label: t("tabs.escalated") },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <h1>{t("mobile.title")}</h1>
        <p>{t("mobile.subtitle")}</p>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`${styles.tab} ${
              activeTab?.value === tab.value ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(tab)}
            disabled={loading}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.searchRow}>
        <label className={styles.search}>
          <LuSearch size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("mobile.searchPlaceholder")}
          />
        </label>
        <div className={styles.filterWrap} ref={filterRef}>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              priority && priority !== "all" ? styles.filterBtnActive : ""
            }`}
            aria-expanded={filterOpen}
            aria-label={t("mobile.filterPriority")}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <CiFilter size={20} />
          </button>
          {filterOpen ? (
            <div className={styles.filterMenu}>
              <p className={styles.filterLabel}>{t("mobile.filterPriority")}</p>
              {priorities.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.filterOption} ${
                    priority === option.value ? styles.filterOptionActive : ""
                  }`}
                  onClick={() => {
                    setPriority(option.value);
                    setFilterOpen(false);
                  }}
                >
                  {option.value !== "all" ? (
                    <i className={styles[`${option.value}Dot`]} />
                  ) : null}
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className={styles.list} aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={styles.cardSkeleton} key={index}>
              <div className={styles.skeletonTop}>
                <span className={styles.skeletonPill} />
                <span className={styles.skeletonDate} />
              </div>
              <span className={styles.skeletonTitle} />
              <span className={styles.skeletonMeta} />
              <span className={styles.skeletonMetaShort} />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !data?.length ? (
        <div className={styles.state}>
          <NoDataFound text={t("mobile.empty")} />
        </div>
      ) : null}

      {!loading ? (
      <div className={styles.list}>
        {data?.map((item) => {
          const request = formatMaintenanceRequest(item, locale) || item;
          const priority = getPriority(request);
          const { house, room } = getHouseAndRoom(request);
          const location = [
            withLabel(t("mobile.house"), house),
            withLabel(t("mobile.room"), room),
          ]
            .filter(Boolean)
            .join(" | ");

          return (
            <article
              key={request.slug || request._id}
              className={styles.card}
              onClick={() => onOpen(request)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(request);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className={styles.cardTop}>
                {priority ? (
                  <span className={`${styles.priority} ${styles[priority]}`}>
                    <i />
                    {t(`mobile.${priority}`)}
                  </span>
                ) : (
                  <span />
                )}
                <span className={styles.date}>
                  {formatListDate(request.createdAt, t)}
                </span>
              </div>
              <div className={styles.titleRow}>
                <h2>{request.issueCategory}</h2>
                <LuChevronRight
                  className={styles.chevron}
                  size={18}
                  style={
                    dir === "rtl" ? { transform: "rotate(180deg)" } : undefined
                  }
                />
              </div>
              <div className={styles.meta}>
                {location ? (
                  <p>
                    <LuHouse size={15} />
                    {location}
                  </p>
                ) : null}
                <p>
                  <LuUser size={15} />
                  {request.residentName}
                </p>
              </div>
            </article>
          );
        })}
      </div>
      ) : null}

      {!loading ? (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalRecords={totalRecords}
        />
      ) : null}
    </div>
  );
}
