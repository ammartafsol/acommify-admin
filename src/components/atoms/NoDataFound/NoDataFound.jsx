import React from "react";
import classes from "./NoDataFound.module.css";
import { GoAlertFill } from "react-icons/go";

export default function NoDataFound({ text = "No Data Found" }) {
  return (
    <div className={classes.main}>
      <GoAlertFill color="var(--primary)" size={50} />
      <p>{text}</p>
    </div>
  );
}
