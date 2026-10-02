import { Spinner } from "react-bootstrap";
import styles from "./styles.module.css";
import { mergeClass } from "@/resources/utils/helper";

export default function Wrapper({
  className = "",
  overlayClassName = "",
  loading = false,
  message = "Please select a machine first",
  active = false,
  children,
  zIndex = 1,
}) {
  return (
    <div
      data-loading={loading}
      className={mergeClass(styles.wrapper, className)}
    >
      {active && (
        <div
          className={mergeClass(styles.overlay, overlayClassName)}
          style={{ zIndex: zIndex }}
        >
          {loading && <Spinner />}
          {message && <p className={styles.message}>{message}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
