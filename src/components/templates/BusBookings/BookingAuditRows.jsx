"use client";

import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { imageUrl } from "@/resources/utils/helper";

const fmt = (d) => (d ? moment(d).format("DD MMM YYYY, HH:mm") : null);

/**
 * Booking history rows for the bus booking view (PDF §9): ticket issue /
 * expiry, and who cancelled, marked the no-show or checked the passenger in —
 * and when. Loaded from the booking detail (the list rows don't carry names).
 */
export default function BookingAuditRows({ slug, itemClass }) {
  const t = useTranslations("busBookings");
  const locale = useLocale();
  const { Get } = useAxios();
  const [b, setB] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      const { response } = await Get({ route: `admin/booking/detail/${slug}`, showAlert: false });
      if (alive) setB(response?.data || null);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (!b) return null;
  const name = (u) => u?.fullName?.[locale] || u?.fullName?.en || "";
  const rows = [
    [t("history.ticketIssued"), fmt(b.ticketIssuedAt || b.createdAt)],
    [t("history.ticketExpires"), fmt(b.ticketExpiresAt || b.bookingEndDate)],
    b.checkedInAt && [t("history.checkedIn"), `${fmt(b.checkedInAt)}${name(b.checkedInBy) ? ` · ${name(b.checkedInBy)}` : ""}`],
    b.noShowAt && [t("history.noShow"), `${fmt(b.noShowAt)}${name(b.noShowBy) ? ` · ${name(b.noShowBy)}` : ""}`],
    b.cancelledAt && [
      t("history.cancelled"),
      `${fmt(b.cancelledAt)}${name(b.cancelledBy) ? ` · ${name(b.cancelledBy)}` : ""}`,
    ],
    b.cancelReason && [t("history.cancelReason"), b.cancelReason],
    [
      t("history.terms"),
      b.termsAccepted
        ? t("history.termsAccepted", { date: fmt(b.termsAcceptedAt) || "" })
        : t("history.termsNotRecorded"),
      b.termsAccepted && b.termsDocument ? imageUrl(b.termsDocument) : null,
    ],
  ].filter(Boolean);

  return rows.map(([label, value, link]) => (
    <div className={itemClass} key={label} data-history={label}>
      <p>{label}</p>
      <p>
        {value || "N/A"}
        {link ? (
          <>
            {" · "}
            <a href={link} target="_blank" rel="noopener noreferrer">
              {t("history.viewTerms")}
            </a>
          </>
        ) : null}
      </p>
    </div>
  ));
}
