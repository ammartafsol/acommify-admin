import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations(namespace = null) {
  const t = useNextIntlTranslations(namespace);
  
  // Add any custom translation logic here
  const translate = (key, values = {}) => {
    try {
      return t(key, values);
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  };
  
  return translate;
}

// Export the original hook as well for cases where we need the full functionality
export { useNextIntlTranslations }; 