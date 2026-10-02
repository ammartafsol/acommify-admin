"use client";
import { usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "localeHistory";

export function useLocaleHistory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get previous history from sessionStorage
    let history = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");

    const query = searchParams?.toString();
    const fullPath = `${pathname}${query ? `?${query}` : ""}`;

    // Push only if different from last
    if (history[history.length - 1] !== fullPath) {
      history.push(fullPath);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [pathname, searchParams]);
}
