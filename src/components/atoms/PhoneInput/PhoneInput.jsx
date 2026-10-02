"use client";
import PropTypes from "prop-types";
import PhoneNumberInput, {
  getCountryCallingCode,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import classes from "./PhoneInput.module.css";

/**
 * Primary UI component for user interaction
 */
const PhoneInput = ({
  dir = "ltr",
  defaultCountry = "GB",
  country,
  label,
  label2, // sub label
  value, // input value
  setValue, //setValue
  noBorder,
  placeholder,
  disabled,
  customStyle, //PhoneInput Container inline Style
  inputStyle, //PhoneInput inline Style
  labelStyle, //Label inline Style
  error, // Show Error Boolean
  errorText, // Error Text
  leftIcon, // Icon For PhoneInput
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
        className={`${[classes.Container, className && className].join(" ")}`}
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
          <PhoneNumberInput
            countryCallingCodeEditable={false}
            international={true}
            defaultCountry={defaultCountry}
            value={value}
            color-variant={variant}
            onChange={(value) => {
              if (disabled) return;
              setValue(value || "");
            }}
            placeholder={placeholder}
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
            onKeyPress={(e) =>
              ["Enter", "NumpadEnter"].includes(e.code) &&
              onEnterClick &&
              onEnterClick()
            }
            ref={inputRef}
            {...props}
            onCountryChange={(country) => {
              if (!country) return;
              try {
                const countryCode = getCountryCallingCode(country);
                props.onCountryChange && props.onCountryChange("+" + countryCode);
              } catch (error) {
                // Handle case where country is invalid or undefined
                console.warn("Invalid country code:", country);
              }
            }}
            // dir={dir}
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

PhoneInput.propTypes = {
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

PhoneInput.defaultProps = {
  placeholder: "enter here...",
  value: "",
  noBorder: false,
  disabled: false,
  error: false,
  errorText: "",
};

export default PhoneInput;
