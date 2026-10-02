import classes from "./TextArea.module.css";

export function TextArea({
  dir = "ltr",
  value,
  setter,
  label,
  placeholder,
  customStyle,
  labelStyle,
  rows = 3,
  className = "",
  containerClass = "",
  disabled,
  labelClass,
  errorText,
  ...props
}) {
  return (
    <div dir={dir} className={[classes.textAreaBox, containerClass].join(" ")}>
      {label && (
        <label
          htmlFor={`textarea${label}`}
          style={{ ...labelStyle }}
          className={`${[
            disabled && classes.labelDisabled,
            classes.label,
            labelClass,
          ].join(" ")}`}
        >
          {label}
        </label>
      )}
      <textarea
        id={`textarea${label}`}
        placeholder={placeholder}
        value={value}
        style={{ ...customStyle }}
        onChange={(e) => {
          setter(e.target.value);
        }}
        onBlur={() => {
          setter(value?.trim());
        }}
        className={className}
        rows={rows}
        disabled={disabled}
        {...props}
      />
      {errorText && (
        <p
          className={`mt-1 ${[classes.errorText].join(" ")}`}
        >{`*${errorText}`}</p>
      )}
    </div>
  );
}
