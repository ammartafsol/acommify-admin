import { Menu, MenuItem } from "@szhsin/react-menu";
import classes from "./MenuComponent.module.css";

export default function MenuComponent({ menuButton, items, value, ...props }) {
  return (
    <>
      <style>
        {`
        .szh-menu__item--hover{
          background-color: inherit !important;
        }
      `}
      </style>
      <Menu
        menuButton={menuButton}
        className={classes.menu}
        {...props}
        onClick={(e) => e.stopPropagation()}
      >
        {items?.map((item, i) => (
          <MenuItem
            key={i}
            onClick={item?.onClick}
            style={item?.style}
            value={value || item?.value}
            {...item}
          >
            {item?.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
