"use client";
import { localeOptions } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function useDirection(localeProp = null) {
  const locale = useLocale();
  const options = localeOptions.find(
    (option) => option.value === (localeProp || locale)
  );

  return options?.isRtl ? "rtl" : "ltr";
}
