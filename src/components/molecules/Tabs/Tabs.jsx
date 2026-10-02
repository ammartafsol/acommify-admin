"use client";

import { mergeClass } from "@/resources/utils/helper";
import classes from "./Tabs.module.css";

export default function Tabs({
  tabsData = [],
  selected = null,
  setSelected = () => {},
  disabled,
  containerClass,
  containerClasses,
  ulCustom,
}) {
  return (
    <ul className={mergeClass(classes.ul, ulCustom)}>
      {tabsData?.map((item, index) => (
        <li
          key={index}
          onClick={() => !disabled && setSelected(item)}
          className={mergeClass(
            classes.list,
            containerClass,
            selected?.value === item?.value ? classes.listSelected : "",
            selected?.value === item?.value ? containerClasses : "",
            disabled ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          {item.icon && (
            <span
              className={
                selected?.value === item?.value
                  ? classes.selectedIcon
                  : classes.icon
              }
            >
              {item.icon}
            </span>
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
