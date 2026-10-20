"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import classes from "./StaffSubNav.module.css";

export default function StaffSubNav() {
  const t = useTranslations("staffNav");
  const pathname = usePathname();

  const items = [
    { label: t("management"), route: "/staffs" },
    { label: t("attendance"), route: "/staffs/attendance" },
    { label: t("documents"), route: "/staffs/documents" },
  ];

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
