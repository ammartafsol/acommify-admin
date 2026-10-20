"use client";
import StaffSubNav from "@/components/molecules/StaffSubNav/StaffSubNav";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { Container } from "react-bootstrap";
import { LuFileText } from "react-icons/lu";
import styles from "./styles.module.css";

export default function StaffDocuments() {
  const t = useTranslations("staffDocumentsPage");

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <StaffSubNav />
      <div className={styles.titleBlock}>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <div className={styles.card}>
        <span className={styles.icon}>
          <LuFileText size={28} />
        </span>
        <h2>{t("comingSoonTitle")}</h2>
        <p>{t("comingSoonText")}</p>
      </div>
    </Container>
  );
}
