import React from "react";
import classes from "./ViewHeader.module.css";
import DropDown from "../DropDown/DropDown";
import { PiGridFour } from "react-icons/pi";
import { CiMenuBurger } from "react-icons/ci";

export default function ViewHeader({
  isGrid,
  setIsGrid,
  dropdownOptions,
  dropDownValue,
  setDropdownValue,
}) {
  return (
    <div className={classes.main}>
      <DropDown
        mainClass={classes.dropdown}
        options={dropdownOptions}
        value={dropDownValue}
        setValue={setDropdownValue}
        placeholder={"Recent"}
        style={{
          singleValue: (base) => ({
            ...base,
            color: "#172A33",
            fontSize: "15px",
            fontWeight: 400,
            fontFamily: "var(--font-lato)",
            letterSpacing: "0.5px",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#172A33",
            fontSize: "15px",
            fontWeight: 400,
          }),
        }}
      />
      <div className={classes.options}>
        <div
          className={isGrid ? "" : classes.active}
          onClick={() => setIsGrid(false)}
          style={{ cursor: "pointer" }}
        >
          <CiMenuBurger size={16} color={isGrid ? "#8C939B" : "#000"} />
        </div>
        <div
          className={isGrid ? classes.active : ""}
          onClick={() => setIsGrid(true)}
          style={{ cursor: "pointer" }}
        >
          <PiGridFour size={16} color={isGrid ? "#000" : "#8C939B"} />
        </div>
      </div>
    </div>
  );
}
