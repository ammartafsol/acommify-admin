"use client";
import { useRouter } from "@/i18n/navigation";

const STORAGE_KEY = "localeHistory";

export function useLocaleAwareBack() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window === "undefined") return;

    let history = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");

    // Remove current route
    history.pop();

    // Get previous route
    const previous = history.pop();
    if (!previous) {
      router.push(`/resident`);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return;
    }

    // Remove previous locale prefix (e.g., /en or /fr)
    const cleanPath = previous.replace(/^\/[a-z]{2}(?=\/|$)/, "");

    // Navigate to the same path under current locale
    router.push(`/${cleanPath}`);

    // Save updated history
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  };

  return handleBack;
}
