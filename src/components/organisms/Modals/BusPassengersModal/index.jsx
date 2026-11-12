"use client";

import RenderToast from "@/components/atoms/RenderToast";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { LuCalendarDays, LuUserCheck, LuUserX, LuUsers } from "react-icons/lu";
import { useSelector } from "react-redux";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import styles from "./styles.module.css";

const ACTIVE = ["accepted", "in-progress", "checked-in", "pending"];
const ACTIONABLE = ["accepted", "in-progress"];
const dayKey = (d) => moment(d).format("YYYY-MM-DD");

/**
 * Reception: passenger list of one journey (bus + date). Check passengers in,
 * or mark a no-show (confirmation first) — the seat is released and the
 * booking stays in the history.
 */
export default function BusPassengersModal({ show, setShow, bus, onChanged }) {
  const t = useTranslations("busManagementPage");
  const locale = useLocale();
  const { Get, Patch } = useAxios();
  const { user, permissions = [] } = useSelector((s) => s.authReducer);
  const canManage =
    ["admin", "business-owner"].includes(user?.role) ||
    permissions.includes("manage-bus-passengers");

  // the bus's scheduled dates: today and upcoming first, then the most recent past ones
  const dates = useMemo(() => {
    const list = (bus?.dateAvailability?.length ? bus.dateAvailability : bus?.availableDatesList || [])
      .map((d) => dayKey(typeof d === "object" && d?.date ? d.date : d))
      .filter((v, i, a) => v !== "Invalid date" && a.indexOf(v) === i)
      .sort();
    const today = dayKey(new Date());
    const upcoming = list.filter((d) => d >= today);
    const past = list.filter((d) => d < today).reverse();
    return [...upcoming, ...past].slice(0, 14);
  }, [bus]);
  const [date, setDate] = useState(() => dates[0] || dayKey(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // booking slug awaiting no-show confirmation
  const [busy, setBusy] = useState("");

  const load = async (d = date) => {
    setLoading(true);
    const { response } = await Get({ route: `admin/bus/passengers/${bus.slug}?date=${d}` });
    setData(response?.data || null);
    setLoading(false);
  };
  useEffect(() => {
    if (bus?.slug) load(date);
  }, [bus?.slug, date]);

  const name = (u) => u?.fullName?.[locale] || u?.fullName?.en || "—";
  const seatsText = (b) =>
    (b.seats || [])
      .map((s) => [s?.seat?.seatNumber && `#${s.seat.seatNumber}`, s?.passengerName].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");

  const act = async (booking, action) => {
    setBusy(`${action}:${booking.slug}`);
    const { response } = await Patch({ route: `admin/booking/bus/${action}/${booking.slug}`, data: {} });
    setBusy("");
    setConfirm(null);
    if (response) {
      RenderToast({
        type: "success",
        message: action === "no-show" ? t("passengers.noShowDone") : t("passengers.checkedInDone"),
      });
      await load();
      onChanged?.();
    }
  };

  const passengers = data?.passengers || [];
  const active = passengers.filter((p) => ACTIVE.includes(p.status));
  const removed = passengers.filter((p) => !ACTIVE.includes(p.status));
  const ended = (b) => b.bookingEndDate && new Date(b.bookingEndDate) <= new Date();
  // PDF statuses: Booked / Checked In / Expired (accepted & in-progress = booked)
  const statusOf = (b) =>
    ended(b) && b.status !== "checked-in"
      ? "expired"
      : ["accepted", "in-progress"].includes(b.status)
        ? "booked"
        : b.status;

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      maxWidth="820px"
      padding="20px 28px"
      header={t("passengers.title")}
    >
      <div className={styles.wrap} data-testid="bus-passengers">
        <div className={styles.busLine}>
          <strong>{bus?.name?.[locale] || bus?.name?.en || bus?.busName}</strong>
          <span>
            {[bus?.startingPointAddress?.[locale] || bus?.startingPointAddress?.en, bus?.endingPointAddress?.[locale] || bus?.endingPointAddress?.en]
              .filter(Boolean)
              .join(" → ")}
          </span>
        </div>

        {/* journey date */}
        <div className={styles.dates}>
          <LuCalendarDays size={18} />
          <div className={styles.chips}>
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                data-date={d}
                className={d === date ? styles.chipActive : ""}
                onClick={() => setDate(d)}
              >
                {moment(d).format("ddd D MMM")}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={date}
            aria-label={t("passengers.pickDate")}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>

        {/* seats */}
        <div className={styles.stats}>
          <div>
            <span>{t("passengers.capacity")}</span>
            <strong data-stat="capacity">{data?.seats?.capacity ?? "—"}</strong>
          </div>
          <div>
            <span>{t("passengers.occupied")}</span>
            <strong data-stat="occupied">{data?.seats?.occupied ?? "—"}</strong>
          </div>
          <div className={styles.free}>
            <span>{t("passengers.available")}</span>
            <strong data-stat="available">{data?.seats?.available ?? "—"}</strong>
          </div>
        </div>

        {loading ? (
          <p className={styles.empty}>{t("passengers.loading")}</p>
        ) : (
          <>
            <h3 className={styles.heading}>
              <LuUsers size={16} /> {t("passengers.active")} <em>{active.length}</em>
            </h3>
            {!active.length ? <p className={styles.empty}>{t("passengers.none")}</p> : null}
            <ul className={styles.list}>
              {active.map((b) => (
                <li key={b.slug} data-booking={b.slug} className={statusOf(b) === "expired" ? styles.expired : ""}>
                  <div className={styles.person}>
                    <strong>{name(b.user)}</strong>
                    <span>
                      {[b.user?.userId, seatsText(b)].filter(Boolean).join(" · ")}
                    </span>
                    {b.status === "checked-in" && b.checkedInAt ? (
                      <em>
                        {t("passengers.checkedInAt", {
                          time: moment(b.checkedInAt).format("HH:mm"),
                          name: name(b.checkedInBy),
                        })}
                      </em>
                    ) : null}
                  </div>
                  <RenderStatusCell status={statusOf(b)} />
                  {canManage && ACTIONABLE.includes(b.status) && !ended(b) ? (
                    confirm === b.slug ? (
                      <div className={styles.confirm} data-testid="no-show-confirm">
                        <p>{t("passengers.confirmNoShow", { name: name(b.user) })}</p>
                        <div>
                          <button type="button" onClick={() => setConfirm(null)} disabled={!!busy}>
                            {t("passengers.cancel")}
                          </button>
                          <button
                            type="button"
                            className={styles.danger}
                            onClick={() => act(b, "no-show")}
                            disabled={!!busy}
                          >
                            {t("passengers.confirm")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.checkIn}
                          onClick={() => act(b, "check-in")}
                          disabled={!!busy}
                        >
                          <LuUserCheck size={15} /> {t("passengers.checkIn")}
                        </button>
                        <button
                          type="button"
                          className={styles.noShow}
                          onClick={() => setConfirm(b.slug)}
                          disabled={!!busy}
                        >
                          <LuUserX size={15} /> {t("passengers.noShow")}
                        </button>
                      </div>
                    )
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>

            {removed.length ? (
              <>
                <h3 className={styles.heading}>
                  {t("passengers.removed")} <em>{removed.length}</em>
                </h3>
                <ul className={`${styles.list} ${styles.removedList}`}>
                  {removed.map((b) => (
                    <li key={b.slug} data-booking={b.slug}>
                      <div className={styles.person}>
                        <strong>{name(b.user)}</strong>
                        <span>{[b.user?.userId, seatsText(b)].filter(Boolean).join(" · ")}</span>
                        <em>
                          {b.status === "no-show"
                            ? t("passengers.noShowBy", {
                                time: moment(b.noShowAt).format("D MMM, HH:mm"),
                                name: name(b.noShowBy),
                              })
                            : b.cancelledAt
                              ? t("passengers.cancelledAt", { time: moment(b.cancelledAt).format("D MMM, HH:mm") })
                              : ""}
                        </em>
                      </div>
                      <RenderStatusCell status={b.status} />
                      <span className={styles.seatFree}>{t("passengers.seatReleased")}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </div>
    </ModalSkeleton>
  );
}
