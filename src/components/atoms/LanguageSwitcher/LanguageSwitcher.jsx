"use client";

import FlagDropDown from "@/components/molecules/FlagDropdown/FlagDropDown";
import { languageOptions } from "@/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import classes from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher({ containerClass }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale) => {
    // Get the current pathname without locale prefix
    const pathWithoutLocale =
      pathname.replace(/^\/[a-z]{2}-[A-Z]{2}/, "") || "/";

    const searchParams = window.location.search;
    const newPath = pathWithoutLocale + searchParams;

    // Navigate to the new locale with the same path
    router.push(newPath, { locale: newLocale.value });
  };

  return (
    <div className={mergeClass(classes.languageSwitcherMain, containerClass)}>
      <FlagDropDown
        key={locale + "flag"}
        options={languageOptions}
        value={languageOptions.find((option) => option.value === locale)}
        setValue={handleLanguageChange}
        mainClass={classes.languageSwitcher}
        isSearchable={false}
        optionImage={(option) => option.imageUrl}
        styles={{
          menu: (base) => ({
            ...base,
            cursor: "pointer",
          }),
          control: (base) => ({
            ...base,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }),
        }}
      />
    </div>
  );
}
