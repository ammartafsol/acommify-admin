"use client";
import { BusDetailModal } from "@/components/templates/BusBookings";
import { LaundryDetailModal } from "@/components/templates/LaundryBooking";
import { AppointmentDetailModal } from "@/components/templates/Appointments";
import { VisitorDetailModal } from "@/components/templates/VisitorBooking";
import { useTranslations } from "@/resources/hooks/useTranslations";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import classes from "./NotificationCard.module.css";

export default function NotificationCard({ notifications }) {
  const t = useTranslations("bookingTypes");
  const locale = useLocale();
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const getModalComponent = () => {
    if (!selectedBooking) return null;

    if (selectedBooking.serviceType === "laundry") {
      return (
        <LaundryDetailModal
          show={showModal}
          setShow={setShowModal}
          data={selectedBooking}
        />
      );
    }

    if (selectedBooking.serviceType === "bus") {
      return (
        <BusDetailModal
          show={showModal}
          setShow={setShowModal}
          data={selectedBooking}
        />
      );
    }

    if (selectedBooking.serviceType === "staff") {
      return (
        <AppointmentDetailModal
          show={showModal}
          setShow={setShowModal}
          data={selectedBooking}
        />
      );
    }

    if (selectedBooking.serviceType === "accommodation") {
      return (
        <VisitorDetailModal
          show={showModal}
          setShow={setShowModal}
          data={selectedBooking}
        />
      );
    }

    return null;
  };

  return (
    <>
      {notifications?.map((notification, idx) => {
        const booking = notification?.booking;
        const title = booking?.serviceType
          ? t(booking.serviceType)
          : notification?.title?.[locale] || notification?.title;
        return (
          <div
            onClick={() => {
              // Only booking notifications have a detail modal
              if (!booking) return;
              setSelectedBooking(booking);
              setShowModal(true);
            }}
            className={classes.main}
            key={idx}
          >
            <div className={classes.left}>
              <Image
                src={"/svg/yellowInfo.svg"}
                alt="Notification Icon"
                width={24}
                height={24}
              />

              <div className={classes.content}>
                {title && typeof title === "string" && <p>{title}</p>}
                {/* <p>
                  {notification.title[locale]
                    ? notification.title[locale]
                    : notification.title}
                </p> */}
                {notification?.message?.[locale] ? (
                  <p>{notification.message[locale]}</p>
                ) : (
                  typeof notification?.message === "string" && (
                    <p>{notification.message}</p>
                  )
                )}
              </div>
            </div>

            <div className={classes.right}>
              <span className={classes.date}>
                {moment(notification.createdAt).locale(locale).format("LLL")}
              </span>
            </div>
          </div>
        );
      })}
      {showModal && getModalComponent()}
    </>
  );
}
