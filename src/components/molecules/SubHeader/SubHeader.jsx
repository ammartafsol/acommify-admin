import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import useDirection from "@/resources/hooks/useDirection";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import React, { useEffect, useRef, useState } from "react";
import { CiFilter } from "react-icons/ci";
import { IoChevronBack } from "react-icons/io5";
import { LuSearch } from "react-icons/lu";
import { RxChevronDown } from "react-icons/rx";
import Tabs from "../Tabs/Tabs";
import classes from "./SubHeader.module.css";

/**
 * @typedef {{ id: string|number, label: string }} Tab
 *
 * @typedef {{
 *   tabsData?: Tab[],
 *   selected?: string|number,
 *   setSelected?: (tabId: string|number) => void
 * }} TabsProps
 *
 * @typedef {{ label: string, value: any }} FilterOption
 *
 * @typedef {{
 *   filterOptions?: FilterOption[],
 *   filterValue?: FilterOption,
 *   setFilterValue?: (val: FilterOption)=>void,
 *   filterOpen?: boolean,
 *   setFilterOpen?: (open: boolean | ((prev: boolean)=>boolean))=>void,
 *   filterRef?: React.RefObject<HTMLDivElement>
 * }} FilterProps
 *
 * @typedef {{
 *   label?: string,
 *   onClick?: ()=>void,
 *   variant?: string,
 *   disabled?: boolean
 *   leftIcon?: React.ReactNode,
 * }} ButtonProps
 *
 * @typedef {{
 *   search?: string,
 *   setSearch?: (val: string)=>void,
 *   placeholder?: string,
 *   className?: string,
 *   inputContainerClass?: string,
 *   leftIcon?: React.ReactNode,
 *   type?: string,
 *   dir?: "ltr" | "rtl"
 * }} SearchProps
 *
 * @typedef {{
 *   title?: string,
 *   showBackBtn?: boolean,
 *   handleBack?: ()=>void,
 *   tabsProps?: TabsProps,
 *   filterProps?: FilterProps,
 *   buttonProps?: ButtonProps,
 *   searchProps?: SearchProps,
 *   childrenAtTop?: boolean,
 *   children?: React.ReactNode,
 *   showSearchAndFilter?: boolean,
 *   searchAndFilterAtTop?: boolean
 * }} SubHeaderProps
 */

/**
 * SubHeader component that provides a flexible header section with optional back button,
 * tabs, search functionality, filters, and action buttons.
 *
 * @param {SubHeaderProps} props
 * @returns {JSX.Element}
 */
export default function SubHeader({
  showHeader = true,
  showTitle = true,
  title = "Title",
  showBackBtn = false,
  handleBack,
  tabsProps = {},
  filterProps = {},
  buttonProps = {},
  searchProps = {},
  multipleFilterProps = {},
  childrenAtTop = false,
  children,
  showSearchAndFilter = false,
  showMultipleFilters = false,
  searchAndFilterAtTop = false,
  icon,
}) {
  const t = useTranslations();
  const dir = useDirection();
  const back = useLocaleAwareBack();
  return (
    <div className={classes.main}>
      {showHeader && (
        <>
          <div className={classes.header}>
            {showBackBtn && (
              <div
                className={classes.back}
                onClick={handleBack ? handleBack : () => back()}
              >
                {dir === "rtl" ? (
                  <IoChevronBack
                    size={16}
                    color="#A8B5BC"
                    style={{ transform: "rotate(180deg)" }}
                  />
                ) : (
                  <IoChevronBack size={16} color="#A8B5BC" />
                )}

                <p>{t("common.back")}</p>
              </div>
            )}
            <div className={classes.headerMain}>
              {showTitle && (
                <div className={classes.headerTitle}>
                  <div className={classes.title}>
                    {icon && <span>{icon}</span>}
                    <p>{title}</p>
                  </div>
                </div>
              )}
              <div className={classes.headerLeft}>
                {childrenAtTop && children}
                {showSearchAndFilter && searchAndFilterAtTop && (
                  <SearchAndFilter searchProps={searchProps} {...filterProps} />
                )}
                {showMultipleFilters && (
                  <AddFilterDropdown t={t} {...multipleFilterProps} />
                )}
                {buttonProps?.label && <Button {...buttonProps} />}
              </div>
            </div>
          </div>
        </>
      )}
      {(tabsProps.tabsData?.length > 0 ||
        (!childrenAtTop && children) ||
        (showSearchAndFilter && !searchAndFilterAtTop)) && (
        <div className={classes.tabsMain}>
          {tabsProps.tabsData?.length > 0 && (
            <Tabs ulCustom={tabsProps.ulCustom} {...tabsProps} />
          )}
          <div className={classes.headerRight}>
            {!childrenAtTop && children}
            {showSearchAndFilter && !searchAndFilterAtTop && (
              <SearchAndFilter searchProps={searchProps} {...filterProps} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SearchAndFilter component that provides search input and filter dropdown functionality.
 *
 * @param {SearchProps & FilterProps} props
 * @returns {JSX.Element}
 */

const SearchAndFilter = ({
  searchProps = {},
  filterOptions,
  filterValue,
  setFilterValue,
  // filterOpen,
  // setFilterOpen,
}) => {
  const direction = useDirection();
  const t = useTranslations();
  const filterRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { search, setSearch, className = "", ...restSearchProps } = searchProps;

  return (
    <div className={classes.headerRight}>
      <Input
        dir={direction}
        value={search}
        setValue={setSearch}
        placeholder={t("common.search")}
        leftIcon={<LuSearch size={16} color="#8C939B" />}
        className={mergeClass(classes.searchInput, className)}
        inputContainerClass={classes.searchInputContainer}
        {...restSearchProps}
      />

      {filterValue && (
        <div
          className={classes.filters}
          onClick={() => setFilterOpen && setFilterOpen((open) => !open)}
          ref={filterRef}
          tabIndex={0}
          style={{ position: "relative" }}
        >
          <CiFilter size={16} color="#8C939B" />
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
                    setFilterValue?.(opt);
                    setFilterOpen?.(false);
                  }}
                >
                  {opt.label}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * MultipleFilterProps component that provides Multiple filter dropdown functionality add remove .
 *
 * @param {MultipleFilterProps} props
 * @returns {JSX.Element}
 */

// const AddFilterDropdown = ({ options = [], selected = {}, setSelected }) => {
//   const [open, setOpen] = useState(false);
//   const [activeDropdown, setActiveDropdown] = useState(null);
//   const [tempSelected, setTempSelected] = useState(selected);
//   const dropdownRef = useRef(null);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setOpen(false);
//         setActiveDropdown(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSelectChange = (key, value) => {
//     setTempSelected((prev) => ({ ...prev, [key]: value }));
//     setActiveDropdown(null);
//   };

//   const handleRangeChange = (key, field, value) => {
//     setTempSelected((prev) => ({
//       ...prev,
//       [key]: { ...prev[key], [field]: value },
//     }));
//   };

//   const handleApply = () => {
//     setSelected(tempSelected);
//     setOpen(false);
//   };

//   const handleCancel = () => {
//     setTempSelected(selected);
//     setOpen(false);
//   };

//   return (
//     <div className={classes.addFilterWrapper} ref={dropdownRef}>
//       <button
//         type="button"
//         className={classes.mainButton}
//         onClick={() => setOpen(!open)}
//       >
//         Filters
//       </button>

//       {open && (
//         <div className={classes.dropdownPanel}>
//           <p>filter BY</p>
//           <div className={classes?.filterAll}>
//             {options.map((opt) => (
//               <div key={opt.value} className={classes.filterRow}>
//                 <div
//                   className={classes.filterHeader}
//                   onClick={() =>
//                     setActiveDropdown(
//                       activeDropdown === opt.value ? null : opt.value
//                     )
//                   }
//                 >
//                   <span>
//                     {tempSelected[opt.value]
//                       ? opt.type === "select"
//                         ? tempSelected[opt.value]
//                         : `${tempSelected[opt.value]?.min || ""} - ${
//                             tempSelected[opt.value]?.max || ""
//                           }`
//                       : opt.label}
//                   </span>
//                   <RxChevronDown
//                     className={`${classes.arrow} ${
//                       activeDropdown === opt.value ? classes.rotate : ""
//                     }`}
//                   />
//                 </div>

//                 {activeDropdown === opt.value && (
//                   <div className={classes.innerDropdown}>
//                     {opt.type === "select" ? (
//                       opt.choices.map((choice) => (
//                         <div
//                           key={choice.value || choice}
//                           className={classes.dropdownItem}
//                           onClick={() =>
//                             handleSelectChange(
//                               opt.value,
//                               choice.value || choice
//                             )
//                           }
//                         >
//                           {choice.label || choice}
//                         </div>
//                       ))
//                     ) : (
//                       <div className={classes.rangeInputs}>
//                         <input
//                           type="number"
//                           placeholder="Min"
//                           value={tempSelected[opt.value]?.min || ""}
//                           onChange={(e) =>
//                             handleRangeChange(opt.value, "min", e.target.value)
//                           }
//                         />
//                         <span>–</span>
//                         <input
//                           type="number"
//                           placeholder="Max"
//                           value={tempSelected[opt.value]?.max || ""}
//                           onChange={(e) =>
//                             handleRangeChange(opt.value, "max", e.target.value)
//                           }
//                         />
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//           <div className={classes.actionBtns}>
//             <button
//               type="button"
//               className={classes.cancelBtn}
//               onClick={handleCancel}
//             >
//               Clear All
//             </button>
//             <button
//               type="button"
//               className={classes.applyBtn}
//               onClick={handleApply}
//             >
//               Apply
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
const AddFilterDropdown = ({
  options = [],
  selected = {},
  setSelected,
  onApply,
  t,
}) => {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [tempSelected, setTempSelected] = useState(selected || {});
  const dropdownRef = useRef(null);
  const [error, setError] = useState("");

  // sync tempSelected when parent selected changes (so UI reflects current applied filters)
  useEffect(() => {
    setTempSelected(selected || {});
  }, [selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectChange = (key, value) => {
    setTempSelected((prev) => ({
      ...prev,
      [key]: value, // for ranges this can be an object {min, max}
    }));
    setActiveDropdown(null);
    // Clear error when select filter changes (error only applies to range filters)
    setError("");
  };

  const handleRangeChange = (key, field, value) => {
    setTempSelected((prev) => {
      const newState = {
        ...prev,
        [key]: { ...(prev[key] || {}), [field]: value },
      };

      // Clear error if values are now valid
      const rangeValue = newState[key];
      if (
        rangeValue?.min !== undefined &&
        rangeValue?.min !== "" &&
        rangeValue?.max !== undefined &&
        rangeValue?.max !== ""
      ) {
        const minNum = Number.parseFloat(rangeValue.min);
        const maxNum = Number.parseFloat(rangeValue.max);

        if (
          !Number.isNaN(minNum) &&
          !Number.isNaN(maxNum) &&
          minNum <= maxNum
        ) {
          setError("");
        }
      }

      return newState;
    });
  };

  const handleApply = () => {
    // Validate all range options
    for (const opt of options) {
      if (opt.type === "range" && tempSelected[opt.value]) {
        const min = tempSelected[opt.value]?.min;
        const max = tempSelected[opt.value]?.max;

        // Only validate if both min and max are provided
        if (
          min !== undefined &&
          min !== "" &&
          max !== undefined &&
          max !== ""
        ) {
          const minNum = Number.parseFloat(min);
          const maxNum = Number.parseFloat(max);

          // Check if values are valid numbers
          if (!Number.isNaN(minNum) && !Number.isNaN(maxNum)) {
            if (minNum > maxNum) {
              setError(t("common.minMustBeLessThanMax"));
              RenderToast({
                type: "error",
                message: t("common.minMustBeLessThanMax"),
              });
              return;
            }
          }
        }
      }
    }

    setSelected(tempSelected || {});
    onApply?.(tempSelected || {});
    setOpen(false);
    setActiveDropdown(null);
    setError("");
  };

  const handleClearAll = () => {
    setTempSelected({});
    setSelected({});
    onApply?.({});
    setOpen(false);
    setActiveDropdown(null);
    setError("");
  };

  return (
    <div className={classes.addFilterWrapper} ref={dropdownRef}>
      <button
        type="button"
        className={classes.mainButton}
        onClick={() => setOpen(!open)}
      >
        {t("roomsHouses.filterOptions.filters")}
      </button>

      {open && (
        <div className={classes.dropdownPanel}>
          <p>{t("roomsHouses.filterOptions.filterBy")}</p>
          <div className={classes?.filterAll}>
            {options.map((opt) => (
              <div key={opt.value} className={classes.filterRow}>
                <div
                  className={classes.filterHeader}
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === opt.value ? null : opt.value
                    )
                  }
                >
                  <span>
                    {tempSelected[opt.value]
                      ? opt.type === "select"
                        ? // show the selected label if possible
                          // if choices are objects, find label
                          Array.isArray(opt.choices)
                          ? (() => {
                              const choice = opt.choices.find(
                                (c) =>
                                  (c.value || c) === tempSelected[opt.value]
                              );
                              return choice?.label || tempSelected[opt.value];
                            })()
                          : tempSelected[opt.value]
                        : // For range type, check if both min and max are empty
                          (() => {
                            const rangeValue = tempSelected[opt.value];
                            const min = rangeValue?.min?.toString().trim();
                            const max = rangeValue?.max?.toString().trim();
                            // If both min and max are empty, show original label
                            if (!min && !max) {
                              return opt.label;
                            }
                            // Otherwise show the label with range: "Beds 5 - 10"
                            return `${opt.label} ${min || ""} - ${max || ""}`;
                          })()
                      : opt.label}
                  </span>
                  <RxChevronDown
                    className={`${classes.arrow} ${
                      activeDropdown === opt.value ? classes.rotate : ""
                    }`}
                  />
                </div>

                {activeDropdown === opt.value && (
                  <div className={classes.innerDropdown}>
                    {opt.type === "select" ? (
                      (opt.choices || []).map((choice) => (
                        <div
                          key={choice.value || choice}
                          className={classes.dropdownItem}
                          onClick={() =>
                            handleSelectChange(
                              opt.value,
                              choice.value || choice
                            )
                          }
                        >
                          {choice.label || choice}
                        </div>
                      ))
                    ) : (
                      <div className={classes.rangeInputs}>
                        <input
                          type="number"
                          placeholder="Min"
                          value={tempSelected[opt.value]?.min || ""}
                          onChange={(e) =>
                            handleRangeChange(opt.value, "min", e.target.value)
                          }
                          min={0}
                          max={tempSelected[opt.value]?.max || ""}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={tempSelected[opt.value]?.max || ""}
                          onChange={(e) => {
                            handleRangeChange(opt.value, "max", e.target.value);
                          }}
                          min={tempSelected[opt.value]?.min || 0}
                          max={Infinity}
                        />
                      </div>
                    )}
                    {error && opt.type === "range" && (
                      <p className={classes.error}>*{error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={classes.actionBtns}>
            <button
              type="button"
              className={classes.cancelBtn}
              onClick={handleClearAll}
            >
              {t("roomsHouses.filterOptions.clear")}
            </button>
            <button
              type="button"
              className={classes.applyBtn}
              onClick={handleApply}
            >
              {t("roomsHouses.filterOptions.apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
