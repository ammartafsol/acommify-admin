import Input from "@/components/atoms/Input/Input";
import React from "react";
import { LuSearch } from "react-icons/lu";
import classes from "./SearchInput.module.css";
export default function SearchInput({
  placeholder,
  value,
  setValue,
  leftIcon,
  rightIcon,
  inputContainerClass,
}) {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      setValue={setValue}
      rightIcon={<LuSearch size={16} color="#8C939B" />}
      className={classes.searchInput}
      inputContainerClass={classes.searchInputContainer || inputContainerClass}
      leftIcon={leftIcon}
    />
  );
}
