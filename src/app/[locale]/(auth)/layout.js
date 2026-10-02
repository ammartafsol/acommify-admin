"use client";
import LanguageSwitcher from "@/components/atoms/LanguageSwitcher";
import styles from "./styles.module.css";
import { mergeClass } from "@/resources/utils/helper";

export default function AuthLayout({ children }) {
  return (
    <div className={mergeClass("ignoreRtl", styles.authLayout)}>
      <div className={styles.authLayoutLeft}>{children}</div>
      <div className={styles.authLayoutRight}>
        <LanguageSwitcher containerClass={styles.languageSwitcher} />
      </div>
    </div>
  );
}
