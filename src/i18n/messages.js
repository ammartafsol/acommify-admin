export async function getMessages(locale) {
  try {
    return (await import(`../messages/${locale}.js`)).default;
  } catch (error) {
    throw new Error(`Failed to load messages for locale: ${locale}`);
  }
}
