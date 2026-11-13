/**
 * Bus booking status as the PDF names it: Booked / Checked In / No-Show /
 * Cancelled / Expired. "accepted" and "in-progress" are a confirmed seat
 * (Booked). A ticket whose journey has ended is Expired, also before the
 * backend job has stored that status; older finished bookings were saved as
 * "completed" — Completed only for a checked-in passenger.
 */
export function busDisplayStatus(booking, now = new Date()) {
  const status = booking?.status;
  if (["cancelled", "no-show", "rejected", "expired", "checked-in"].includes(status)) return status;
  const ended = booking?.bookingEndDate && new Date(booking.bookingEndDate) <= now;
  if (status === "completed") return booking?.checkedInAt ? "completed" : "expired";
  if (ended) return "expired";
  if (["accepted", "in-progress", "pending"].includes(status)) return "booked";
  return status || "N/A";
}

export const isExpiredStatus = (s) => s === "expired";
