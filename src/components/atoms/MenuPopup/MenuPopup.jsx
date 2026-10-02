import { Menu, MenuItem } from "@szhsin/react-menu";
import classes from "./MenuPopup.module.css";
import { ReactSVG } from "react-svg";
import { useRouter } from "next/navigation";
import { BiChevronDown } from "react-icons/bi";

export default function MenuPopup({ menuButton, items, value, ...props }) {
  const router = useRouter();

  return (
    <>
      <style>
        {`
        .szh-menu__item--hover {
          background-color: inherit !important;
        }
      `}
      </style>

      <Menu
        position="anchor"
        menuButton={({ open }) => (
          <div className={classes.menuButton}>
            {menuButton}
            {/* Arrow icon */}
            <BiChevronDown
              size={18}
              className={`${classes.arrowIcon} ${
                open ? classes.arrowOpen : ""
              }`}
            />
          </div>
        )}
        className={classes.menu}
        {...props}
        onClick={(e) => e.stopPropagation()}
      >
        {items?.map((child, i) => (
          <MenuItem
          className={classes.menuItem}
            key={i}
            onClick={() => {
              if (child.route) {
                router.push(child.route);
              }
              child?.onClick?.();
            }}
          >
            <ReactSVG src={child.icon} />
            {child.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
