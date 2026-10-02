import { languageOptions, locales, routing } from "@/i18n";
import { CustomProvider } from "@/store/customProvider";
import "aos/dist/aos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Inter, Lato } from "next/font/google";
import { notFound } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";
import "@/app/styles/globals.css";
import Header from "@/components/molecules/Header/Header";
import "react-week-picker/src/lib/calendar.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
});

export const metadata = {
  title: "Acommify",
  description:
    "Acommify Dashboard: Manage residents, appointments, bookings, and maintenance requests efficiently in one place. Streamline operations for residential communities.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  let messages;
  try {
    const { getMessages } = await import("@/i18n");
    messages = await getMessages(locale);
  } catch (error) {
    notFound();
  }

  const isRtl = languageOptions.find((lang) => lang.value === locale)?.isRtl;

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <body
        className={`${inter.variable} ${lato.variable} ${isRtl ? "isRtl" : ""}`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <CustomProvider>
            <Header />
            <ToastContainer />
            {children}
          </CustomProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
