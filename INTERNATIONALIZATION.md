# Internationalization (i18n) Setup with next-intl

This project has been configured with next-intl to support English language.

## Supported Languages

- **en**: English

## Project Structure

```
src/
├── i18n.js                    # Locale configuration
├── middleware.js              # Next.js middleware for locale routing
├── messages/                  # Translation files
│   └── en.json
└── app/
    ├── [locale]/              # Locale-specific routes
    │   ├── layout.js          # Locale-specific layout
    │   ├── page.js            # Home page
    │   └── (auth)/
    │       ├── layout.js      # Auth layout
    │       └── login/
    │           └── page.js    # Login page
    └── page.js                # Root redirect
```

## How to Use

### 1. Basic Translation Usage

```jsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("dashboard.welcome")}</h1>
      <p>{t("common.loading")}</p>
    </div>
  );
}
```

### 2. Namespace-based Translation

```jsx
import { useTranslations } from "next-intl";

export default function AuthComponent() {
  const t = useTranslations("auth");

  return (
    <form>
      <label>{t("email")}</label>
      <input type="email" placeholder={t("email")} />
      <button>{t("login")}</button>
    </form>
  );
}
```

### 3. Translation with Parameters

```jsx
import { useTranslations } from "next-intl";

export default function ValidationComponent() {
  const t = useTranslations();

  return (
    <div>
      <p>{t("validation.minLength", { min: 8 })}</p>
      <p>{t("validation.maxLength", { max: 100 })}</p>
    </div>
  );
}
```

### 4. Language Switcher Component

The project includes a `LanguageSwitcher` component that allows users to change
languages:

```jsx
import LanguageSwitcher from "@/components/atoms/LanguageSwitcher";

export default function Header() {
  return (
    <nav>
      <div className="navbar-brand">Acommify</div>
      <LanguageSwitcher />
    </nav>
  );
}
```

## URL Structure

The application uses locale prefixes in URLs:

- `/en` - English

The root URL `/` automatically redirects to the default locale (`/en`).

## Adding New Translations

### 1. Add Translation Keys

Add new translation keys to the language file in `src/messages/`:

```json
// src/messages/en.json
{
  "newSection": {
    "title": "New Section Title",
    "description": "This is a new section"
  }
}
```

### 2. Use in Components

```jsx
import { useTranslations } from "next-intl";

export default function NewComponent() {
  const t = useTranslations("newSection");

  return (
    <div>
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>
    </div>
  );
}
```

## Adding New Languages

### 1. Update Configuration

Add the new locale to `src/i18n.js`:

```javascript
export const locales = ["en", "fr"]; // Add French
export const defaultLocale = "en";
```

### 2. Create Translation File

Create `src/messages/fr.json` with French translations.

### 3. Update Middleware

Update the matcher in `src/middleware.js`:

```javascript
export const config = {
  matcher: ["/", "/(en|fr)/:path*"], // Add 'fr'
};
```

### 4. Update Language Switcher

Add the new language to the `languageOptions` array in `LanguageSwitcher.jsx`:

```javascript
const languageOptions = [
  {
    value: "en",
    label: "English (UK)",
    imageUrl: "/svg/flags/ukFlag.svg",
  },
];
```

## Best Practices

1. **Use Namespaces**: Organize translations by feature or page
2. **Consistent Keys**: Use consistent naming conventions for translation keys
3. **Fallback Handling**: Always provide fallback text for missing translations
4. **Parameter Validation**: Validate parameters passed to translation functions
5. **Testing**: Test translations in all supported languages

## Available Translation Keys

The following translation namespaces are available:

- `navigation` - Navigation menu items
- `auth` - Authentication-related text
- `common` - Common UI elements
- `dashboard` - Dashboard-specific content
- `residents` - Resident management
- `appointments` - Appointment management
- `bookings` - Booking management
- `maintenance` - Maintenance requests
- `settings` - Settings and preferences
- `errors` - Error messages
- `validation` - Form validation messages

## Development Workflow

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000` (redirects to `/en`)
3. Use the language switcher to test different languages
4. Add new translations as needed
5. Test all languages before deploying

## Troubleshooting

### Common Issues

1. **Translation not found**: Check if the key exists in all language files
2. **Locale not working**: Verify the locale is added to the configuration
3. **Routing issues**: Check middleware configuration
4. **Build errors**: Ensure all translation files are valid JSON

### Debug Mode

Enable debug mode to see missing translations:

```javascript
// In your component
const t = useTranslations();
console.log("Translation key:", t("some.key"));
```

This setup provides a robust foundation for language support in your Acommify
application, currently configured for English (UK) with the ability to easily
add more languages in the future.
