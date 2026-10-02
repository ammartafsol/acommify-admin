"use client";
import { FaCaretDown, FaCaretUp } from "react-icons/fa6";
import ReactSelect, { components } from "react-select";
import React, { useRef, useEffect, useState } from "react";
import classes from "./FlagDropDown.module.css";
import useDirection from "@/resources/hooks/useDirection";

const FlagDropDown = ({
  options,
  value,
  setValue,
  placeholder,
  disabled,
  mainClass,
  indicatorColor = "var(--Dark-gray)",
  dropDownContainerClass = "",
  variant = "",
  dropdownIndicator = <FaCaretDown size={16} color="var(--Dark-gray)" />,
  dropUpIndicator = <FaCaretUp size={16} color="var(--Dark-gray)" />,
  optionImage,
  ...props
}) => {
  const dir = useDirection();

  const DropdownIndicator = (props) => (
    <components.DropdownIndicator {...props}>
      {props.isFocused ? dropUpIndicator : dropdownIndicator}
    </components.DropdownIndicator>
  );

  // Show flag and label for menu options
  const Option = (props) => (
    <components.Option {...props}>
      <span style={{ display: "flex", alignItems: "center" }}>
        {optionImage && optionImage(props.data) ? (
          <img
            src={optionImage(props.data)}
            alt={props.data.label}
            style={{
              width: 36,
              aspectRatio: "4 / 3",
              objectFit: "cover",
              background: "#fff",
              marginInlineEnd: 8,
            }}
          />
        ) : null}
        <span style={{ fontWeight: 500, fontSize: 16 }}>
          {props.data.label}
        </span>
      </span>
    </components.Option>
  );

  // Only show flag for selected value
  const SingleValue = (props) => {
    const data = props.data;
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {optionImage && optionImage(data) ? (
          <img
            src={optionImage(data)}
            alt={data.label}
            style={{
              width: 36,
              aspectRatio: "4 / 3",
              borderRadius: "4px",
              objectFit: "contain",
            }}
          />
        ) : null}
      </div>
    );
  };

  const dropDownStyle = {
    control: (styles, { isDisabled }) => ({
      ...styles,
      display: "flex",
      opacity: isDisabled ? 0.5 : 1,
      backgroundColor: "#F4F7FD !important",
      padding: "4px 8px",
      borderRadius: "25px",
      color: "black",
      boxShadow: "none",
      fontFamily: "var(--font-lato)",
      fontWeight: 400,
      fontSize: 16,
      letterSpacing: 1,
      lineHeight: "22px",
      cursor: isDisabled ? "not-allowed" : "pointer",
      border: "none",
    }),
    menu: (styles) => ({
      ...styles,
      width: "max-content",
      borderRadius: "11px",
      overflow: "hidden",
      maxHeight: "400px",
      overflowY: "auto",
    }),

    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected && "var(--Light-blue)",
      padding: "12px 16px",
      borderBottom: "1px solid var(--border-color)",
      cursor: "pointer",
    }),
    singleValue: (styles) => ({
      ...styles,
      padding: 0,
      margin: 0,
    }),
  };

  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    if (!menuIsOpen) return;
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setMenuIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuIsOpen]);

  return (
    <div
      className={`${[classes.Container, mainClass].join(" ")}`}
      data-variant={variant}
      ref={selectRef}
    >
      <style>{`
        .DropdownOptionContainer__menu {
          margin: 0px;
        }
        .DropdownOptionContainer::-webkit-scrollbar {
          width: 6px;
        }
        .DropdownOptionContainer::-webkit-scrollbar-track {
          border-radius: 50px;
          background-color: var(--White);
          margin-block: 20px;
        }
        .DropdownOptionContainer::-webkit-scrollbar-thumb {
          width: 5px;
          border-radius: 50px;
          background-color: var(--Blue);
        }
        .DropdownOptionContainer__menu {
          box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.25);
        }
      `}</style>
      <div
        className={`${[classes.dropdownContainer, dropDownContainerClass].join(
          " "
        )}`}
        data-disabled={disabled}
      >
        <ReactSelect
          key={Math.random()}
          value={value}
          onChange={(val, action) => {
            setValue(val, action);
            setMenuIsOpen(false);
          }}
          isRtl={dir === "rtl"}
          options={options}
          isClearable={false}
          isSearchable={false}
          isDisabled={disabled}
          placeholder={placeholder}
          styles={dropDownStyle}
          components={{
            IndicatorSeparator: () => null,
            DropdownIndicator,
            Option,
            SingleValue,
          }}
          menuIsOpen={menuIsOpen}
          onMenuOpen={() => setMenuIsOpen(true)}
          onMenuClose={() => setMenuIsOpen(false)}
          {...props}
        />
      </div>
    </div>
  );
};

export default FlagDropDown;
