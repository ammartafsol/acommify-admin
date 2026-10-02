"use client";
import { useState, useEffect, useMemo } from "react";
import { createTranslator, useLocale } from "next-intl";

export function useDynamicTranslations(namespace) {
  const initialLocale = useLocale();
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(null);

  // Load JSON messages when locale changes
  useEffect(() => {
    (async () => {
      const mod = await import(`@/messages/${locale}.js`);
      setMessages(mod.default);
    })();
  }, [locale]);

  const t = useMemo(() => {
    if (!messages) return (key) => key; // fallback shows key
    return createTranslator({
      locale,
      namespace,
      messages,
    });
  }, [messages, locale, namespace]);

  return { t, setLocale };
}
