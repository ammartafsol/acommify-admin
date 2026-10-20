// Max time logout waits for the check-out request before continuing anyway
const CHECK_OUT_TIMEOUT_MS = 4000;

/**
 * Checks a staff member out (if they are checked in) as part of logging out.
 * Never throws and never shows a toast: "not checked in" is the normal case.
 */
export async function checkOutOnLogout({ Post, role }) {
  if (role !== "staff") return;
  try {
    await Promise.race([
      Post({ route: "staff-attendance/check-out", showAlert: false }),
      new Promise((resolve) => setTimeout(resolve, CHECK_OUT_TIMEOUT_MS)),
    ]);
  } catch {
    // Logging out must still work if the request fails
  }
}
