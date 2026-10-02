import React from "react";
import classes from "./SpinnerLoading.module.css";
export default function SpinnerLoading() {
  return (
    <div className={classes.spinnerContainer}>
      <svg viewBox="25 25 50 50" className={classes.spinner}>
        <circle cx="50" cy="50" r="20" className={classes.spinnerCircle} />
      </svg>
    </div>
  );
}
