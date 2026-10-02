"use client";
import PropTypes from "prop-types";
import classes from "./DatePicker.module.css";
import "react-datepicker/dist/react-datepicker.css";
import DatePickerInput from "react-datepicker";
import { BiCalendar } from "react-icons/bi";

const DatePicker = ({
  dir = "ltr",
  dateFormat = "dd/MM/yyyy",
  label,
  label2, // sub label
  value = "", // input value
  setValue, //setValue
  noBorder = false,
  placeholderText = "enter here...",
  disabled = false,
  customStyle, //DatePicker container inline Style
  inputStyle, //DatePicker inline Style
  labelStyle, //Label inline Style
  error = false, // Show Error Boolean
  errorText = "", // Error Text
  leftIcon, // Icon For DatePicker
  rightIcon,
  inputRef,
  inputBoxClass,
  onEnterClick,
  className,
  containerStyles = {},
  inputContainerClass = "",
  variant = "",
  ...props
}) => {
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
          {leftIcon && <div className={classes.leftIconBox}>{leftIcon}</div>}
          <DatePickerInput
            showPopperArrow={false}
            dateFormat={dateFormat}
            selected={value}
            color-variant={variant}
            showIcon
            icon={<BiCalendar color="var(--primary)" />}
            onChange={(e) => {
              setValue(e);
            }}
            disabled={disabled}
            placeholderText={placeholderText}
            id={`input${label}`}
            className={` ${[
              inputBoxClass,
              classes.inputClass,
              noBorder && classes.noBorder,
            ].join(" ")}`}
            style={{
              ...inputStyle,
              ...(leftIcon && { paddingInlineStart: 50 }),
            }}
            ref={inputRef}
            {...props}
          />
          {rightIcon && <div className={classes.rightIconBox}>{rightIcon}</div>}
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

DatePicker.propTypes = {
  label: PropTypes.string,
  placeholderText: PropTypes.string,
  value: PropTypes.string.isRequired,
  setValue: PropTypes.string,
  noBorder: PropTypes.bool,
  disabled: PropTypes.bool,
  customStyle: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  label2: PropTypes.string,
};

export default DatePicker;
