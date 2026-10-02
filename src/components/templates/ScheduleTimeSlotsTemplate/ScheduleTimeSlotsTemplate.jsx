"use client";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import DropDown from "@/components/molecules/DropDown/DropDown";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import GenerateSlotsModal from "@/components/organisms/Modals/GenerateSlotsModal/GenerateSlotsModal";
import useAxios from "@/interceptor/axios-functions";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { FaClock, FaEdit, FaPlus } from "react-icons/fa";
import styles from "./ScheduleTimeSlotsTemplate.module.css";

const TYPE_CONFIG = (t) => ({
  laundry: {
    heading: t("laundryTitle"),
    label: t("machineLabel"),
    placeholder: t("machinePlaceholder"),
    route: "admin/machine/all",
    slotType: "machine",
  },
  appointment: {
    heading: t("title"),
    label: t("staffLabel"),
    placeholder: t("staffPlaceholder"),
    route: "admin/user/all?role=staff",
    slotType: "staff",
  },
  visitor: {
    heading: t("visitorTitle"),
    label: t("visitorLabel"),
    placeholder: t("visitorPlaceholder"),
    route: "admin/accommodation/all?userType=visitor",
    slotType: "accommodation",
  },
});

const formatTime = (time) => moment(time, "HH:mm").format("hh:mm A");

export default function ScheduleTimeSlotsTemplate({ type = "laundry" }) {
  const back = useLocaleAwareBack();
  const [loading, setLoading] = useState({
    getOptions: false,
    getSlots: false,
  });
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const t = useTranslations("timeslotsPage");
  const [show, setShow] = useState(false);
  const [modalState, setModalState] = useState({
    slots: [],
    day: "",
    startTime: null,
    endTime: null,
  });
  const WEEKDAYS = [
    { key: "monday", label: t("weekDays.monday") },
    { key: "tuesday", label: t("weekDays.tuesday") },
    { key: "wednesday", label: t("weekDays.wednesday") },
    { key: "thursday", label: t("weekDays.thursday") },
    { key: "friday", label: t("weekDays.friday") },
    { key: "saturday", label: t("weekDays.saturday") },
    { key: "sunday", label: t("weekDays.sunday") },
  ];

  const [slotsData, setSlotsData] = useState([]);
  const { Get } = useAxios();
  const abortControllerRef = useRef(null);

  const typeConfig = useMemo(() => {
    const config = TYPE_CONFIG(t);
    return config[type] || config.laundry;
  }, [type, t]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (type) {
      getOptions();
    }
  }, [type]);

  const getOptions = useCallback(async () => {
    let abortError = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setLoading((prev) => ({ ...prev, getOptions: true }));

    const { response, error } = await Get({
      route: typeConfig.route,
      signal: abortControllerRef.current.signal,
    });

    if (response?.status === "success") {
      const mappedOptions = response.data.map((item) => ({
        ...item,
        value: item?.slug,
        label:
          type === "laundry"
            ? item?.name?.en
            : type === "visitor"
            ? item?.accommodationNumber
            : item?.fullName?.en,
      }));
      setOptions(mappedOptions);
    }

    if (error?.code === "ERR_CANCELED") {
      abortError = true;
    }

    if (!abortError) {
      setLoading((prev) => ({ ...prev, getOptions: false }));
      abortControllerRef.current = null;
    }
  }, [type, typeConfig.route, Get]);

  // Fetch slots for selected option
  useEffect(() => {
    if (selectedOption) {
      fetchSlots(selectedOption.value);
    } else {
      setSlotsData([]);
    }
  }, [selectedOption, typeConfig.slotType]);

  const fetchSlots = useCallback(
    async (optionSlug) => {
      setLoading((prev) => ({ ...prev, getSlots: true }));

      const { response } = await Get({
        route: `admin/schedule/all/${optionSlug}?type=${typeConfig.slotType}`,
      });
      if (response?.status === "success") {
        setSlotsData(response.data || []);
      } else {
        setSlotsData([]);
      }
      setLoading((prev) => ({ ...prev, getSlots: false }));
    },
    [Get, typeConfig.slotType]
  );

  const handleOpenModal = useCallback((data) => {
    setShow(true);
    setModalState(data);
  }, []);

  const handleOptionChange = useCallback((option) => {
    setSelectedOption(option);
    setShow(false);
    setModalState({
      slots: [],
      day: "",
      startTime: null,
      endTime: null,
    });
  }, []);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <SubHeader
        showBackBtn
        title={typeConfig.heading}
        handleBack={() => back()}
      />

      <div className={styles.slotsContainer}>
        <div className={styles.sectionHeader}>
          <h3>
            {typeConfig.heading.replace("Schedule ", "")} -{" "}
            {t("weeklySchedule")}
          </h3>
          <p>{t("manageTimeSlots")}</p>
          <div className={styles.utcNote}>
            <span>
              <FaClock /> {t("utcNote") || "All times are in UTC"}
            </span>
          </div>
        </div>
        <div className={styles.controlSection}>
          <DropDown
            label={typeConfig.label}
            disabled={loading.getOptions}
            value={selectedOption}
            setValue={handleOptionChange}
            options={options}
            placeholder={
              loading.getOptions ? t("fetchingOptions") : typeConfig.placeholder
            }
          />
        </div>
        {loading.getSlots ? (
          <SpinnerLoading />
        ) : (
          selectedOption && (
            <div className={styles.weekdaysGrid}>
              {WEEKDAYS?.map((day) => {
                const dayData = slotsData?.find((item) => item.day === day.key);
                return (
                  <DayCard
                    data={dayData}
                    key={day.key}
                    day={day}
                    slots={dayData?.timeSlots || []}
                    onOpenModal={handleOpenModal}
                    t={t}
                  />
                );
              })}
            </div>
          )
        )}
      </div>

      {show && (
        <GenerateSlotsModal
          t={t}
          show={show}
          setShow={setShow}
          data={{
            ...modalState,
            slug: selectedOption?.value,
            type: typeConfig.slotType,
          }}
          previousEvent={
            modalState?.slots?.length
              ? {
                  slots: modalState.slots,
                  startTime: modalState.startTime,
                  endTime: modalState.endTime,
                }
              : null
          }
          cb={() => fetchSlots(selectedOption.value)}
        />
      )}
    </Container>
  );
}

// Memoized DayCard component
const DayCard = ({ data, day, slots, onOpenModal, t }) => {
  const handleAddClick = useCallback(() => {
    onOpenModal({ day: day.key, slots: [], startTime: null, endTime: null });
  }, [day.key, onOpenModal]);

  const handleEditClick = useCallback(() => {
    onOpenModal({
      day: day.key,
      slots: slots,
      startTime: data?.startTime,
      endTime: data?.endTime,
    });
  }, [day.key, slots, onOpenModal]);

  return (
    <div className={styles.dayCard}>
      <div className={styles.dayHeader}>
        <div className={styles.dayInfo}>
          <h4>{day.label}</h4>
          <span className={styles.slotCount}>
            {slots.length} slot{slots.length !== 1 ? "s" : ""}
          </span>
        </div>

        {slots.length === 0 ? (
          <FaPlus
            className={styles.addIcon}
            title={t("addDaySlots")}
            onClick={handleAddClick}
          />
        ) : (
          <FaEdit
            className={styles.editIcon}
            title={t("editDaySlots")}
            onClick={handleEditClick}
          />
        )}
      </div>

      <div className={styles.slotsWrapper}>
        {slots.length > 0 ? (
          slots.map((slot, index) => (
            <div key={index} className={styles.slotItem}>
              <div className={styles.slotTime}>
                <FaClock className={styles.clockIcon} />
                <span>
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noSlots}>
            <p>{t("noSlotsAvailable")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
