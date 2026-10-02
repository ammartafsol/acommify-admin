"use client";
import { mergeClass } from "@/resources/utils/helper";
import Image from "next/image";
import PropTypes from "prop-types";
import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import classes from "./Input.module.css";

/**
 * Primary UI component for user interaction
 */
const Input = ({
  dir = "ltr",
  type = "text",
  label,
  label2, // sub label
  value, // input value
  setValue, //setValue
  noBorder,
  labelClass,
  placeholder,
  disabled,
  customStyle, //Input container inline Style
  inputStyle, //Input inline Style
  labelStyle, //Label inline Style
  error, // Show Error Boolean
  errorText, // Error Text
  leftIcon, // Icon For Input
  rightIcon,
  inputRef,
  inputBoxClass,
  onEnterClick,
  className,
  containerStyles = {},
  inputContainerClass = "",
  variant = "",
  leftIconClass = "",
  rightIconClass = "",
  ...props
}) => {
  const [passToggle, setPassToggle] = useState(false);

  return (
    <>
      <div
        dir={dir}
        className={`${[classes.container, className && className].join(" ")}`}
        data-variant={variant}
        style={{ ...containerStyles }}
      >
        {label && (
          <label
            htmlFor={`input${label}`}
            className={`${[
              classes.labelText,
              labelClass,
              disabled && classes.disabled,
            ].join(" ")}`}
            style={{ ...labelStyle }}
          >
            {label} {label2 && label2}
          </label>
        )}
        <div
          className={`${[classes.inputContainer, inputContainerClass].join(
            " "
          )}`}
          style={{ ...customStyle }}
        >
          {leftIcon && <div className={mergeClass(classes.leftIconBox, leftIconClass)}>{leftIcon}</div>}
          <input
            value={value}
            color-variant={variant}
            autoComplete="input"
            onChange={(e) => {
              setValue(e.target.value);
            }}
            disabled={disabled}
            placeholder={placeholder}
            type={passToggle == true ? "text" : type}
            id={`input${label}`}
            className={` ${[
              inputBoxClass,
              classes.inputClass,
              noBorder && classes.noBorder,
            ].join(" ")}`}
            style={{
              ...inputStyle,
              ...(leftIcon && {
                paddingInlineStart: 50,
              }),
            }}
            onKeyDownCapture={(e) => {
              ["Enter", "NumpadEnter"].includes(e.code) &&
                onEnterClick &&
                onEnterClick();
            }}
            onBlur={() => {
              if (
                typeof value === "string" &&
                (type === "text" || type === "") &&
                setValue
              ) {
                setValue(value?.trim());
              }
            }}
            ref={inputRef}
            {...props}
            onKeyDown={(e) => {
              if (type == "number") {
                return (
                  ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                );
              }
            }}
          />

          {rightIcon && <div className={mergeClass(classes.rightIconBox, rightIconClass)}>{rightIcon}</div>}

          {type === "password" && (
            <span
              className={mergeClass(classes.passwordIcon, "pointer")}
              onClick={() => setPassToggle(!passToggle)}
            >
              {passToggle ? (
                <FaRegEye size={24} color="var(--black)" />
              ) : (
                <FaRegEyeSlash size={24} />
              )}
            </span>
          )}
        </div>
        {errorText && (
          <p className={`mt-1 ${[classes.errorText].join(" ")}`}>
            *{errorText}
          </p>
        )}
      </div>
    </>
  );
};

Input.propTypes = {
  type: PropTypes.oneOf.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  setValue: PropTypes.string,
  noBorder: PropTypes.bool,
  disabled: PropTypes.bool,
  customStyle: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  label2: PropTypes.string,
};

Input.defaultProps = {
  type: "text",
  placeholder: "enter here...",
  value: "",
  noBorder: false,
  disabled: false,
  error: false,
  errorText: "",
};

export default Input;
