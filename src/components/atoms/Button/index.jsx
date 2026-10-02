"use client";
import React from "react";
import classes from "./Button.module.css";
import { Spinner } from "react-bootstrap";

// Variants
const Button = ({
  label,
  customStyle,
  onClick,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  className = "",
  variant,
  type,
  loading = false,
  showSpinner = false,
  spinnerStyles = {},
  ...props
}) => {
  return (
    <>
      <button
        type={type}
        style={{ ...customStyle, border: "none" }}
        onClick={onClick}
        disabled={disabled}
        color-variant={variant}
        className={`${classes.btn} ${className}`}
        {...props}
      >
        {leftIcon && leftIcon}
        {label && <label>{label}</label>}

        {children && { children }}
        {!loading && rightIcon && rightIcon}
        {loading && showSpinner && <Spinner style={spinnerStyles} size="sm" />}
      </button>
    </>
  );
};

export default Button;
