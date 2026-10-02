"use client";
import React from "react";
import classes from "./Checkbox.module.css";

export default function Checkbox({ label, value, setValue }) {
  return (
    <div className={classes.main}>
      <input
        type="checkbox"
        id={label}
        checked={value}
        onChange={() => setValue(!value)}
      />
      <label htmlFor={label}>{label}</label>
    </div>
  );
}
