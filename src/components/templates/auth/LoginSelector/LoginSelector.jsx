"use client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { Container } from "react-bootstrap";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { LuBuilding2, LuLayoutDashboard, LuShieldCheck } from "react-icons/lu";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";

const LOGIN_OPTIONS = [
  {
    href: "/login",
    labelKey: "selectCentre",
    Icon: LuBuilding2,
  },
  {
    href: "/login/nationwide-dashboard",
    labelKey: "selectNationwide",
    Icon: LuLayoutDashboard,
  },
  {
    href: "/login/admin",
    labelKey: "selectAdmin",
    Icon: LuShieldCheck,
  },
];

export default function LoginSelector() {
  const t = useTranslations("loginPage");
  const router = useRouter();

  return (
    <Container className={mergeClass("containerFluid", styles.wrapper)}>
      <div className={styles.selectorBox}>
        <div className={styles.header}>
          <h1>{t("selectorTitle")}</h1>
          <p className={styles.subtitle}>{t("selectorSubtitle")}</p>
        </div>

        <div className={styles.options}>
          {LOGIN_OPTIONS.map((option, index) => {
            const Icon = option.Icon;
            return (
              <button
                key={option.href}
                type="button"
                className={styles.optionCard}
                style={{ animationDelay: `${index * 80}ms` }}
                onClick={() => router.push(option.href)}
              >
                <span className={styles.optionIcon}>
                  <Icon size={22} aria-hidden />
                </span>
                <span className={styles.optionLabel}>{t(option.labelKey)}</span>
                <span className={styles.optionArrow} aria-hidden>
                  <HiOutlineArrowRight size={18} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
