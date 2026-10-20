"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { STAFF_TABS } from "@/resources/utils/headerRoutes";
import { mergeClass } from "@/resources/utils/helper";
import { useSelector } from "react-redux";
import classes from "./StaffSubNav.module.css";

export default function StaffSubNav() {
  const t = useTranslations("staffNav");
  const pathname = usePathname();
  const { permissions = [], user } = useSelector((state) => state.authReducer);

  // Admins see every tab; everyone else only the tabs they have permission for
  const items = STAFF_TABS.filter(
    (tab) => user?.role === "admin" || permissions.includes(tab.permission),
  ).map((tab) => ({ label: t(tab.key), route: tab.route }));

  return (
    <nav className={classes.nav} aria-label={t("label")}>
      {items.map((item) => {
        const active = pathname === item.route;
        return (
          <Link
            key={item.route}
            href={item.route}
            className={mergeClass(classes.link, active ? classes.active : "")}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
