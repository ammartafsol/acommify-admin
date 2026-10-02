// MultiDatePicker.jsx
import { MdCancel } from "react-icons/md";
import DatePicker, { DateObject } from "react-multi-date-picker";
import DatePanel from "react-multi-date-picker/plugins/date_panel";
import styles from "./MultiDatePicker.module.css";
import "./styles.css";

export default function MultiDatePicker({
  value,
  dir,
  onChange,
  label = "Select Dates",
  placeholder = "Pick dates...",
  disabled = false,
  error = "",
  required = false,
  minDate,
  maxDate,
  className = "",
  multi = true,
}) {
  const normalizedValue = Array.isArray(value)
    ? value.map((v) =>
        v instanceof DateObject
          ? v
          : new DateObject({ date: v, format: "YYYY-MM-DD" })
      )
    : value;

  const handleDateChange = (dates) => {
    const arr = Array.isArray(dates) ? dates : [dates];
    const normalized = arr
      .filter(Boolean)
      .map((d) => (d instanceof DateObject ? d : new DateObject(d)));
    onChange(normalized);
  };

  return (
    <div className={`${styles.wrapper} ${className} `} dir={dir}>
      {label && (
        <label className={styles.label} dir={dir}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <DatePicker
        plugins={[<DatePanel />]}
        dateSeparator=", "
        multiple={multi}
        value={normalizedValue}
        onChange={handleDateChange}
        placeholder={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className={styles.datePicker}
        inputClass={styles.input}
        containerClassName={styles.container}
        format="YYYY-MM-DD"
        dir={dir}
        style={{ width: "100%"  }}
      />

      {/* Display selected dates as badges below input */}
      {normalizedValue && normalizedValue.length > 0 && (
        <div className={styles.selectedDates}>
          <div className={styles.datesContainer}>
            {normalizedValue.map((date, index) => (
              <span
                key={index}
                className={styles.dateBadge}
                onClick={() => {
                  // Remove date when clicked
                  const updatedDates = normalizedValue.filter(
                    (_, i) => i !== index
                  );
                  onChange(updatedDates);
                }}
              >
                {date.format("DD MMM YYYY")}
                <MdCancel color="red" />
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <div className={styles.error}>*{error}</div>}
    </div>
  );
}
