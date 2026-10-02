"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { CiFilter } from "react-icons/ci";
import { IoChevronBack } from "react-icons/io5";
import classes from "./TopHeader.module.css";

import Input from "@/components/atoms/Input/Input";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import Button from "@/components/atoms/Button";
import { LuSearch } from "react-icons/lu";
import DropDown from "../DropDown/DropDown";
import Tabs from "../Tabs/Tabs";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";

export default function TopHeader({
  tabs = [],
  dropdownOptions = [],
  dropdownValue,
  setDropdownValue,
  dropdownProps = {},
  title = "Title",
  selectedTab,
  setSelectedTab,
  search,
  setSearch,
  filterOptions = [],
  filterValue,
  setFilterValue,
  filterDropdownProps = {},
  mainClass,
  icon,
  showSearch = false,
  showFilters = false,
  showDropdown = false,
  showBackBtn = true,
  btnLabel = "",
  btnVariant = "primary",
  btnLeftIcon = null,
  activeDocType = "pdf",
  setActiveDocType = () => {},
  showPdfTabs = false,
  btnOnClick,
  btnClass,
  direction,
  children,
}) {
  const t = useTranslations();
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const back = useLocaleAwareBack();

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      back();
    }
  };

  const filteredOptions = useMemo(() => {
    if (!search) return dropdownOptions;
    return dropdownOptions.filter((opt) =>
      (opt.label || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [dropdownOptions, search]);

  return (
    <div className={classes.main}>
      {showBackBtn && (
        <div className={classes.back} onClick={handleBack}>
          {direction === "rtl" ? (
            <IoChevronBack
              size={16}
              color="#A8B5BC"
              style={{ rotate: "180deg" }}
            />
          ) : (
            <IoChevronBack size={16} color="#A8B5BC" />
          )}

          <p>{t("common.back")}</p>
        </div>
      )}

      <div className={mergeClass(mainClass, classes.header)}>
        {tabs?.length > 0 && (
          <Tabs
            tabsData={tabs}
            selected={selectedTab}
            setSelected={setSelectedTab}
          />
        )}

        {title && (
          <div className={classes.title}>
            {icon && <span>{icon}</span>}
            <p>{title}</p>
          </div>
        )}

        <div className={classes.headerRight}>
          {showSearch && (
            <Input
              placeholder={t("common.search")}
              value={search}
              setValue={setSearch}
              leftIcon={<LuSearch size={16} color="#8C939B" />}
              className={classes.searchInput}
              inputContainerClass={classes.searchInputContainer}
              {...(direction && { dir: direction })}
            />
          )}
          {showFilters && (
            <div
              className={classes.filters}
              onClick={() => setFilterOpen((open) => !open)}
              ref={filterRef}
              tabIndex={0}
              style={{ position: "relative" }}
            >
              <CiFilter size={16} color="#8C939B" />
              {/* <p className={classes.filterLabel}>{t("common.filter")}</p> */}
              <p className={classes.filterLabel}>
                {filterValue?.label || t("common.filter")}
              </p>
              {filterOpen && (
                <div className={classes.filterDropdown}>
                  {filterOptions?.map((opt) => (
                    <p
                      key={opt.value ?? opt.label}
                      className={`${classes.filterOption} ${
                        filterValue?.value === opt.value
                          ? classes.filterOptionSelected
                          : ""
                      }`}
                      onClick={() => {
                        setFilterValue(opt);
                        setFilterOpen(false);
                      }}
                    >
                      {opt.label}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {showDropdown && (
            <DropDown
              options={filteredOptions}
              value={dropdownValue}
              setValue={setDropdownValue}
              dropDownContainerClass={classes.dropdownContainer}
              mainClass={classes.dropdownMain}
              {...dropdownProps}
              styles={{
                singleValue: (styles) => ({
                  ...styles,
                  color: "var(--Blue)",
                }),
              }}
            />
          )}
          {showPdfTabs && (
            <div className={classes.wordPdfTab}>
              <div
                className={
                  activeDocType === "pdf"
                    ? classes.pdfTabActive
                    : classes.wordTabInactive
                }
                onClick={() => setActiveDocType("pdf")}
              >
                {t("common.pdf")}
              </div>
              <div
                className={
                  activeDocType === "word"
                    ? classes.pdfTabActive
                    : classes.wordTabInactive
                }
                onClick={() => setActiveDocType("word")}
              >
                {t("common.word")}
              </div>
            </div>
          )}
          {btnOnClick && (
            <Button
              variant={btnVariant}
              leftIcon={btnLeftIcon}
              label={btnLabel}
              className={mergeClass(btnClass, classes.downloadBtn)}
              onClick={btnOnClick}
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
