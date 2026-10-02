"use client";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { Container } from "react-bootstrap";
import { FaArrowRight, FaCalendarAlt, FaTshirt, FaUsers } from "react-icons/fa";
import { useSelector } from "react-redux";
import styles from "./TimeSlotsTemplate.module.css";

export default function TimeSlotsTemplate() {
  const t = useTranslations("scheduleTimeSlotsPage");
  const { permissions } = useSelector((state) => state.authReducer);
  const router = useRouter();
  const routes = [
    // ("view-staff")
    permissions.includes("see-appointments-slots") && {
      title: t("appointmentSlots"),
      route: "appointment-slots",
      icon: FaCalendarAlt,
      color: "green",
    },
    // ("view-machines")
    permissions.includes("see-laundry-slots") && {
      title: t("laundryBookingSlots"),
      route: "laundry-booking-slots",
      icon: FaTshirt,
      color: "orange",
    },
    // ("view-accommodations")
    permissions.includes("see-visitor-slots") && {
      title: t("visitorBookingSlots"),
      route: "visitor-booking-slots",
      icon: FaUsers,
      color: "blue",
    },
  ].filter(Boolean);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader showBackBtn title={t("title")} />
      <div className={styles.cardMapper}>
        {routes?.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className={`${styles.card} ${styles[`card${item.color}`]}`}
              onClick={() => router.push(`/time-slots/${item.route}`)}
            >
              <div className={styles.cardIcon}>
                <IconComponent />
              </div>
              <span className={styles.title}>{item.title}</span>
              <div className={styles.cardArrow}>
                <FaArrowRight />
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
