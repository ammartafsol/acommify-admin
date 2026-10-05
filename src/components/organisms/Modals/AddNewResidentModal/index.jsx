import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import PhoneInput from "@/components/atoms/PhoneInput/PhoneInput";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import { addNewResidentSchema } from "@/formik/schema/addNewResidentSchema";
import { languageObject, locales } from "@/i18n";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import {
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BiTrash } from "react-icons/bi";
import { IoAddOutline, IoCalendarOutline } from "react-icons/io5";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./styles.module.css";

export default function AddNewResidentModal({
  show,
  setShow,
  onSubmit,
  modalData = null,
  setModalData,
  roomOnly = false,
}) {
  const isEdit = Boolean(modalData?.userId);
  const lockFields = Boolean(modalData);
  const locale = useLocale();
  const direction = useDirection(locale);
  const { Get, Post, Patch } = useAxios();
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState("");
  const [translating, setTranslating] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(locale);
  const [accommodationOptions, setAccommodationOptions] = useState([]);
  const [remainingBeds, setRemainingBeds] = useState(0);
  const { t, setLocale } = useDynamicTranslations("residentsPage.modal");
  const [myAndRemainingBeds, setMyAndRemainingBeds] = useState(0);

  // Memoize options to prevent unnecessary reinitializations
  const relationshipOptions = useMemo(
    () => [
      { value: "father", label: t("relationShipOptions.father") },
      { value: "mother", label: t("relationShipOptions.mother") },
      {
        value: "sibling",
        label: t("relationShipOptions.sibling"),
      },
      { value: "spouse", label: t("relationShipOptions.spouse") },
      {
        value: "children",
        label: t("relationShipOptions.children"),
      },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "on-site", label: t("onsite") },
      { value: "off-site", label: t("offsite") },
    ],
    [t]
  );

  const schoolPlacementOptions = useMemo(
    () => [
      { value: "placed", label: t("schoolPlacement.placed") },
      { value: "not-placed", label: t("schoolPlacement.notPlaced") },
    ],
    [t]
  );

  const transportTypeOptions = useMemo(
    () => [
      { value: "bus", label: t("transportType.bus") },
      { value: "carpool", label: t("transportType.carpool") },
      { value: "family", label: t("transportType.family") },
    ],
    [t]
  );

  const genderOptions = useMemo(
    () => [
      { value: "male", label: t("genderOptions.male") },
      { value: "female", label: t("genderOptions.female") },
      { value: "other", label: t("genderOptions.other") },
    ],
    [t]
  );

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(activeLanguage);
  }, [activeLanguage, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return addNewResidentSchema(t);
  }, [t, activeLanguage]);

  const initialValues = {
    fullName: { ...languageObject },
    callingCode: "+44",
    phoneNumber: "",
    email: "",
    noOfBeds: null,
    dob: "",
    roomNumber: null,
    dateOfArrival: "",
    residentStatus: null,
    gender: null,
    trcNumber: "",
    ppsnNumber: "",
    medicalCardNumber: "",
    familyMembers: [],
    self: null,
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: false, // Changed to false to prevent unnecessary reinitializations
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  // Reset form when modalData changes (for edit mode)
  useEffect(() => {
    if (modalData) {
      formik.setValues({
        fullName: modalData?.fullName || { ...languageObject },
        callingCode: modalData?.callingCode || "+44",
        phoneNumber:
          modalData?.callingCode && modalData?.phoneNumber
            ? `${modalData.callingCode}${modalData.phoneNumber}`
            : modalData?.phoneNumber
            ? `+${modalData.phoneNumber}`
            : "",
        email: modalData?.email || "",
        noOfBeds: {
          label: modalData?.noOfBeds || "",
          value: modalData?.noOfBeds || "",
        },
        dob: modalData?.familyMembers?.[0]?.dob
          ? moment(modalData?.familyMembers[0]?.dob).format("YYYY-MM-DD")
          : "",
        roomNumber: modalData?.accommodation
          ? {
              label: modalData?.accommodation?.accommodationNumber,
              value: modalData?.accommodation?.slug,
            }
          : null,
        dateOfArrival: modalData?.dateOfArrival
          ? moment(modalData.dateOfArrival).format("YYYY-MM-DD")
          : "",
        residentStatus:
          statusOptions.find(
            (item) => item.value === modalData?.residentStatus
          ) || null,
        gender:
          genderOptions.find(
            (item) =>
              item.value ===
              (modalData?.gender || modalData?.familyMembers?.[0]?.gender)
          ) || null,
        trcNumber: modalData?.trcNumber || "",
        ppsnNumber: modalData?.ppsnNumber || "",
        medicalCardNumber: modalData?.medicalCardNumber || "",
        familyMembers:
          modalData?.familyMembers?.slice(1)?.map((member) => ({
            ...member,
            dob: moment(member.dob).format("YYYY-MM-DD"),
            relationship:
              relationshipOptions.find(
                (item) => item.value === member.relationship
              ) || null,
            schoolPlacement:
              schoolPlacementOptions.find(
                (item) => item.value === member.schoolPlacement
              ) || "",
            schoolName: member.schoolName || { ...languageObject },
            year: member.year || "",
            transportType:
              transportTypeOptions.find(
                (item) => item.value === member.transportType
              ) || "",
            books: member.books || [""],
            trcNumber: member.trcNumber || "",
            gender:
              genderOptions.find((item) => item.value === member.gender) ||
              null,
          })) || [],
        self: modalData?.familyMembers?.[0] || null,
      });
    }
  }, [modalData]);

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [activeLanguage, t, validationSchema]);

  // Update dropdown option labels when language changes
  useEffect(() => {
    // Update residentStatus label
    if (formik.values.residentStatus?.value) {
      const updatedStatus = statusOptions.find(
        (opt) => opt.value === formik.values.residentStatus.value
      );
      if (
        updatedStatus &&
        updatedStatus.label !== formik.values.residentStatus.label
      ) {
        formik.setFieldValue("residentStatus", updatedStatus);
      }
    }

    // Update gender label
    if (formik.values.gender?.value) {
      const updatedGender = genderOptions.find(
        (opt) => opt.value === formik.values.gender.value
      );
      if (updatedGender && updatedGender.label !== formik.values.gender.label) {
        formik.setFieldValue("gender", updatedGender);
      }
    }

    // Update family members dropdown labels
    formik.values.familyMembers.forEach((member, index) => {
      // Update relationship
      if (member.relationship?.value) {
        const updatedRelationship = relationshipOptions.find(
          (opt) => opt.value === member.relationship.value
        );
        if (
          updatedRelationship &&
          updatedRelationship.label !== member.relationship.label
        ) {
          formik.setFieldValue(
            `familyMembers[${index}].relationship`,
            updatedRelationship
          );
        }
      }

      // Update gender
      if (member.gender?.value) {
        const updatedGender = genderOptions.find(
          (opt) => opt.value === member.gender.value
        );
        if (updatedGender && updatedGender.label !== member.gender.label) {
          formik.setFieldValue(`familyMembers[${index}].gender`, updatedGender);
        }
      }

      // Update schoolPlacement
      if (member.schoolPlacement?.value) {
        const updatedSchoolPlacement = schoolPlacementOptions.find(
          (opt) => opt.value === member.schoolPlacement.value
        );
        if (
          updatedSchoolPlacement &&
          updatedSchoolPlacement.label !== member.schoolPlacement.label
        ) {
          formik.setFieldValue(
            `familyMembers[${index}].schoolPlacement`,
            updatedSchoolPlacement
          );
        }
      }

      // Update transportType
      if (member.transportType?.value) {
        const updatedTransportType = transportTypeOptions.find(
          (opt) => opt.value === member.transportType.value
        );
        if (
          updatedTransportType &&
          updatedTransportType.label !== member.transportType.label
        ) {
          formik.setFieldValue(
            `familyMembers[${index}].transportType`,
            updatedTransportType
          );
        }
      }
    });
  }, [
    activeLanguage,
    statusOptions,
    genderOptions,
    relationshipOptions,
    schoolPlacementOptions,
    transportTypeOptions,
  ]);

  const toRoomOption = (item, occupiedBeds = modalData?.noOfBeds || 0) => ({
    label: item?.accommodationNumber,
    value: item?.slug,
    totalBeds: item?.noOfBeds,
    remainingBeds: Number(item?.remainingBeds) || 0,
    occupiedBeds:
      (Number(item?.noOfBeds) || 0) - (Number(item?.remainingBeds) || 0),
    myOccupiedBeds: occupiedBeds,
  });

  useEffect(() => {
    if (!show) return;
    let cancelled = false;
    const currentRoom = modalData?.accommodation;
    const neededBeds = Number(modalData?.noOfBeds) || 0;
    const currentOption = currentRoom?.slug
      ? [toRoomOption(currentRoom, neededBeds)]
      : [];

    if (currentOption.length) {
      setAccommodationOptions(currentOption);
    }

    const loadRooms = async () => {
      setLoading("gettingOptions");
      const { response } = await Get({
        route: "admin/accommodation/all?userType=resident&occupancyStatus=all",
      });
      if (cancelled) return;

      const rooms = Array.isArray(response?.data) ? response.data : [];
      const options = rooms
        .map((item) => toRoomOption(item, neededBeds))
        .filter((option) => option.label && option.value)
        .filter((option) => {
          if (option.value === currentRoom?.slug) return true;
          if (!lockFields) return option.remainingBeds > 0;
          return neededBeds === 0 || option.remainingBeds >= neededBeds;
        });

      currentOption.forEach((option) => {
        if (!options.some((item) => item.value === option.value)) {
          options.unshift(option);
        }
      });

      setAccommodationOptions(options);
      const selectedRoom = options.find(
        (option) => option.value === currentRoom?.slug,
      );
      if (selectedRoom) {
        setRemainingBeds(selectedRoom.remainingBeds);
        setMyAndRemainingBeds(selectedRoom.remainingBeds + neededBeds);
      }
      setLoading("");
    };

    loadRooms();
    return () => {
      cancelled = true;
    };
  }, [show, modalData]);

  const addFamilyMember = () => {
    formik.setFieldValue("familyMembers", [
      ...formik.values.familyMembers,
      {
        fullName: { ...languageObject },
        relationship: "",
        dob: "",
        schoolName: { ...languageObject },
        schoolPlacement: "",
        year: "",
        transportType: "",
        books: [""],
        trcNumber: "",
        gender: null,
      },
    ]);
  };

  async function handleSubmit(values) {
    setLoading("submitting");
    let payload = {
      userRole: "resident",
      fullName: values.fullName,
      email: values.email,
      noOfBeds: values.noOfBeds.value - (modalData?.noOfBeds || 0),
      dob: moment(values.dob),
      dateOfArrival: moment(values.dateOfArrival),
      callingCode: values.callingCode,
      phoneNumber: values.phoneNumber?.slice(values.callingCode?.length),
      accommodationSlug: values.roomNumber?.value,
      residentStatus: values.residentStatus?.value,
      gender: values.gender?.value,
      trcNumber: values.trcNumber,
      ppsnNumber: values.ppsnNumber,
      medicalCardNumber: values.medicalCardNumber,
      familyMembers: [],
    };

    if (values.familyMembers.length > 0) {
      payload.familyMembers = values.familyMembers?.map((member) => ({
        fullName: member.fullName,
        relationship: member.relationship?.value,
        dob: moment(member.dob),
        gender: member.gender?.value,
        trcNumber: member.trcNumber || "",
        ...(member.relationship?.value === "children" && {
          schoolPlacement: member.schoolPlacement?.value,
          ...(member.schoolPlacement?.value === "placed" && {
            schoolName: member.schoolName,
            year: member.year,
            transportType: member.transportType?.value,
            books: member.books.filter((book) => book.trim() !== ""),
          }),
        }),
      }));
    }
    payload.familyMembers?.unshift({
      fullName: values.fullName,
      relationship: "self",
      dob: moment(values.dob),
      gender: values.gender?.value,
    });

    const API = isEdit ? Patch : Post;
    const { response } = await API({
      route: isEdit
        ? `admin/user/update/${modalData?.slug}`
        : "admin/user/create",
      data: payload,
    });

    if (response?.status === "success") {
      RenderToast({
        type: "success",
        message: isEdit
          ? t("toasts.residentUpdated")
          : t("toasts.residentAdded"),
      });
      setShow(false);
      formik.resetForm();
      setModalData(null);
      onSubmit();
    }
    setLoading("");
  }

  const removeFamilyMember = (index) => {
    const updatedFamilyMembers = [...formik.values.familyMembers];
    updatedFamilyMembers.splice(index, 1);
    formik.setFieldValue("familyMembers", updatedFamilyMembers);
  };

  const handleAutoFill = async () => {
    setTranslating(true);
    const allLocales = locales.filter((l) => l !== activeLanguage); // translate from activeLanguage to others

    // Collect missing fields
    const missingFields = [];
    if (!formik.values.fullName[activeLanguage]) {
      missingFields.push("Resident Full Name");
    }
    for (let i = 0; i < formik.values.familyMembers.length; i++) {
      const member = formik.values.familyMembers[i];
      if (!member.fullName?.[activeLanguage]) {
        missingFields.push(`Family Member ${i + 1} Full Name`);
      }
      if (
        member.relationship?.value === "children" &&
        member.schoolPlacement?.value === "placed" &&
        !member.schoolName?.[activeLanguage]
      ) {
        missingFields.push(`Family Member ${i + 1} School Name`);
      }
    }

    if (missingFields.length > 0) {
      RenderToast({
        type: "info",
        message: `${t("toasts.languagesMessage")}: ${missingFields.join(", ")}`,
      });
      setTranslating(false);
      return;
    }

    // Translate fullName
    for (const locale of allLocales) {
      const original = formik.values.fullName[activeLanguage];
      if (original) {
        const translated = await translateText(original, locale);
        formik.setFieldValue(`fullName.${locale}`, translated);
      }
    }

    // Translate familyMembers fields
    for (let i = 0; i < formik.values.familyMembers.length; i++) {
      const member = formik.values.familyMembers[i];
      for (const locale of allLocales) {
        // fullName
        if (member.fullName?.[activeLanguage]) {
          const translated = await translateText(
            member.fullName[activeLanguage],
            locale
          );
          formik.setFieldValue(
            `familyMembers[${i}].fullName.${locale}`,
            translated
          );
        }
        // schoolName
        if (
          member.relationship?.value === "children" &&
          member.schoolPlacement?.value === "placed" &&
          member.schoolName?.[activeLanguage]
        ) {
          const translated = await translateText(
            member.schoolName[activeLanguage],
            locale
          );
          formik.setFieldValue(
            `familyMembers[${i}].schoolName.${locale}`,
            translated
          );
        }
      }
    }
    RenderToast({
      type: "success",
      message: t("toasts.translationSuccessMessage"),
    });
    setTranslating(false);
  };

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      padding="20px 32px"
      header={
        roomOnly ? t("editRoom") : modalData ? t("editResident") : t("header")
      }
    >
      <div
        className={mergeClass(
          classes.main,
          dir === "ltr" ? "ignoreRtlNested" : ""
        )}
        dir={dir}
      >
        <LanguageSelector
          selected={activeLanguage}
          setSelected={(newSelected) => {
            setActiveLanguage(newSelected);
            setLocale(newSelected);
          }}
          setDirection={setDir}
        />
        <Button
          label={translating ? t("translating") : t("autoFill")}
          onClick={handleAutoFill}
          disabled={loading === "submitting" || translating || lockFields}
        />
        <Input
          dir={dir}
          placeholder={t("namePlaceholder")}
          label={t("name")}
          value={formik.values.fullName?.[activeLanguage] || ""}
          setValue={(val) =>
            formik.setFieldValue(`fullName.${activeLanguage}`, val)
          }
          errorText={
            formik.touched.fullName?.[activeLanguage] &&
            formik.errors.fullName?.[activeLanguage]
          }
          disabled={loading === "submitting" || lockFields}
          type="text"
        />

        <Input
          dir={dir}
          type="date"
          placeholder={t("dobPlaceholder")}
          label={t("dob")}
          value={formik.values.dob}
          setValue={(val) => formik.setFieldValue("dob", val)}
          errorText={formik.touched.dob && formik.errors.dob}
          disabled={loading === "submitting" || modalData}
          max={moment().format("YYYY-MM-DD")}
          rightIcon={<IoCalendarOutline size={20} color="#B2B5BA" />}
          rightIconClass={classes.calendarIcon}
        />

        <Input
          dir={dir}
          type="date"
          placeholder={t("dateOfArrivalPlaceholder")}
          label={t("dateOfArrival")}
          value={formik.values.dateOfArrival}
          setValue={(val) => formik.setFieldValue("dateOfArrival", val)}
          errorText={
            formik.touched.dateOfArrival && formik.errors.dateOfArrival
          }
          disabled={loading === "submitting" || lockFields}
          rightIcon={<IoCalendarOutline size={20} color="#B2B5BA" />}
          rightIconClass={classes.calendarIcon}
          // min={moment().format("YYYY-MM-DD")}
        />

        <Input
          dir={dir}
          placeholder={t("emailPlaceholder")}
          label={t("email")}
          value={formik.values.email}
          setValue={(val) => formik.setFieldValue("email", val)}
          errorText={formik.touched.email && formik.errors.email}
          disabled={loading === "submitting" || modalData}
          type="email"
        />

        <PhoneInput
          dir={dir}
          placeholder={t("phonePlaceholder")}
          label={t("phone")}
          value={formik.values.phoneNumber}
          setValue={(val) => formik.setFieldValue("phoneNumber", val)}
          errorText={formik.touched.phoneNumber && formik.errors.phoneNumber}
          onCountryChange={(code) => {
            formik.setFieldValue("callingCode", code);
          }}
          disabled={loading === "submitting" || lockFields}
        />

        <DropDown
          isPortal
          dir={dir}
          placeholder={t("roomNumberPlaceholder")}
          label={t("roomNumber")}
          options={accommodationOptions}
          value={formik.values.roomNumber}
          setValue={(val) => {
            formik.setFieldValue("roomNumber", val);
            if (val) {
              setRemainingBeds(val.remainingBeds);
              setMyAndRemainingBeds(
                val.remainingBeds + (modalData?.noOfBeds || 0)
              );
            } else {
              setRemainingBeds(0);
            }
            if (!lockFields) {
              formik.setFieldValue("noOfBeds", null);
            }
          }}
          errorText={formik.touched.roomNumber && formik.errors.roomNumber}
          dropDownContainerClass={classes.dropDownContainerClass}
          hideSelectedOptions={false}
          disabled={loading === "submitting" || loading === "gettingOptions"}
        />

        <DropDown
          isPortal
          dir={dir}
          placeholder={t("noOfBedsPlaceholder")}
          label={t("noOfBeds") + ` (${remainingBeds} ` + t("available") + `)`}
          options={Array.from({ length: myAndRemainingBeds }, (_, i) => ({
            label: `${i + 1}`,
            value: i + 1,
          }))}
          value={formik.values.noOfBeds}
          setValue={(val) => {
            formik.setFieldValue("noOfBeds", val);
          }}
          error={formik.touched.noOfBeds && formik.errors.noOfBeds}
          dropDownContainerClass={classes.dropDownContainerClass}
          disabled={
            loading === "submitting" ||
            Boolean(loading) ||
            !formik.values.roomNumber ||
            lockFields
          }
        />

        <DropDown
          isPortal
          dir={dir}
          label={t("gender")}
          placeholder={t("genderPlaceholder")}
          options={genderOptions}
          dropDownContainerClass={classes.dropDownContainerClass}
          value={formik.values.gender}
          setValue={(val) => formik.setFieldValue("gender", val)}
          error={formik.touched.gender && formik.errors.gender}
          disabled={loading === "submitting" || lockFields}
        />

        <DropDown
          isPortal
          dir={dir}
          label={t("status")}
          placeholder={t("statusPlaceholder")}
          dropDownContainerClass={classes.dropDownContainerClass}
          options={statusOptions}
          value={formik.values.residentStatus}
          setValue={(val) => formik.setFieldValue("residentStatus", val)}
          error={formik.touched.residentStatus && formik.errors.residentStatus}
          disabled={loading === "submitting" || lockFields}
        />
        <Input
          dir={dir}
          label={t("trcNumber")}
          placeholder={t("trcNumberPlaceholder")}
          value={formik.values.trcNumber}
          setValue={(val) => formik.setFieldValue("trcNumber", val)}
          errorText={formik.touched.trcNumber && formik.errors.trcNumber}
          disabled={loading === "submitting" || lockFields}
        />
        <Input
          dir={dir}
          label={t("ppsnNumber")}
          placeholder={t("ppsnNumberPlaceholder")}
          value={formik.values.ppsnNumber}
          setValue={(val) => formik.setFieldValue("ppsnNumber", val)}
          errorText={formik.touched.ppsnNumber && formik.errors.ppsnNumber}
          disabled={loading === "submitting" || lockFields}
        />
        <Input
          dir={dir}
          label={t("medicalCardNumber")}
          placeholder={t("medicalCardNumberPlaceholder")}
          value={formik.values.medicalCardNumber}
          setValue={(val) => formik.setFieldValue("medicalCardNumber", val)}
          errorText={
            formik.touched.medicalCardNumber && formik.errors.medicalCardNumber
          }
          disabled={loading === "submitting" || lockFields}
        />

        {/* Add family members */}
        <div dir={dir} className={classes.familyMembersContainer}>
          <div className={classes.familyMembersHeader}>
            <p>{modalData ? t("familyMembers") : t("addFamilyMember")}</p>
            {!lockFields && (
              <div className={classes.addIcon} onClick={addFamilyMember}>
                <IoAddOutline size={20} color="#fff" />
              </div>
            )}
          </div>
          {formik.values.familyMembers.map((familyMember, index) => (
            <Fragment key={index}>
              <p className={classes.familyMemberLabel}>
                {t("familyMemberLabel")}: {index + 1}
                {!lockFields && (
                  <BiTrash
                    className="c-p"
                    onClick={() => removeFamilyMember(index)}
                    color="#FF0000"
                    size={20}
                  />
                )}
              </p>
              <div key={index} className={classes.familyMembersInputs}>
                <Input
                  dir={dir}
                  label={t("familyMemberName")}
                  placeholder={t("familyMemberNamePlaceholder")}
                  value={familyMember?.fullName?.[activeLanguage] || ""}
                  setValue={(val) =>
                    formik.setFieldValue(
                      `familyMembers[${index}].fullName.${activeLanguage}`,
                      val
                    )
                  }
                  errorText={
                    formik.touched.familyMembers?.[index]?.fullName?.[
                      activeLanguage
                    ] &&
                    formik.errors.familyMembers?.[index]?.fullName?.[
                      activeLanguage
                    ]
                  }
                  disabled={loading === "submitting" || lockFields}
                  type="text"
                />
                {/* trc number */}
                <Input
                  dir={dir}
                  label={t("trcNumber")}
                  placeholder={t("trcNumberPlaceholder")}
                  value={familyMember?.trcNumber}
                  setValue={(val) =>
                    formik.setFieldValue(
                      `familyMembers[${index}].trcNumber`,
                      val
                    )
                  }
                  errorText={
                    formik.touched.familyMembers?.[index]?.trcNumber &&
                    formik.errors.familyMembers?.[index]?.trcNumber
                  }
                  disabled={loading === "submitting" || lockFields}
                  type="text"
                />
                <DropDown
                  isPortal
                  dir={dir}
                  label={t("gender")}
                  placeholder={t("genderPlaceholder")}
                  options={genderOptions}
                  dropDownContainerClass={classes.dropDownContainerClass}
                  value={familyMember?.gender || ""}
                  setValue={(val) =>
                    formik.setFieldValue(`familyMembers[${index}].gender`, val)
                  }
                  error={
                    formik.touched.familyMembers?.[index]?.gender &&
                    formik.errors.familyMembers?.[index]?.gender
                  }
                  disabled={loading === "submitting" || lockFields}
                />
                <DropDown
                  isPortal
                  dir={dir}
                  label={t("relationship")}
                  placeholder={t("relationshipPlaceholder")}
                  options={relationshipOptions}
                  dropDownContainerClass={classes.dropDownContainerClass}
                  value={familyMember?.relationship || ""}
                  setValue={(val) =>
                    formik.setFieldValue(
                      `familyMembers[${index}].relationship`,
                      val
                    )
                  }
                  error={
                    formik.touched.familyMembers?.[index]?.relationship &&
                    formik.errors.familyMembers?.[index]?.relationship
                  }
                  disabled={loading === "submitting" || lockFields}
                />
                {familyMember?.relationship?.value === "children" && (
                  <>
                    <DropDown
                      isPortal
                      dir={dir}
                      label={t("schoolPlacement.label")}
                      placeholder={t("schoolPlacement.placeholder")}
                      options={schoolPlacementOptions}
                      dropDownContainerClass={classes.dropDownContainerClass}
                      value={familyMember?.schoolPlacement || ""}
                      setValue={(val) =>
                        formik.setFieldValue(
                          `familyMembers[${index}].schoolPlacement`,
                          val
                        )
                      }
                      disabled={loading === "submitting" || lockFields}
                    />
                    {familyMember?.schoolPlacement?.value === "placed" && (
                      <>
                        <Input
                          dir={dir}
                          label={t("schoolName")}
                          placeholder={t("schoolNamePlaceholder")}
                          value={
                            familyMember?.schoolName?.[activeLanguage] || ""
                          }
                          setValue={(val) =>
                            formik.setFieldValue(
                              `familyMembers[${index}].schoolName.${activeLanguage}`,
                              val
                            )
                          }
                          errorText={
                            formik.touched.familyMembers?.[index]?.schoolName?.[
                              activeLanguage
                            ] &&
                            formik.errors.familyMembers?.[index]?.schoolName?.[
                              activeLanguage
                            ]
                          }
                          disabled={loading === "submitting" || lockFields}
                          type="text"
                        />
                        <Input
                          dir={dir}
                          label={t("year")}
                          placeholder={t("yearPlaceholder")}
                          value={familyMember?.year || ""}
                          setValue={(val) =>
                            formik.setFieldValue(
                              `familyMembers[${index}].year`,
                              val
                            )
                          }
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          errorText={
                            formik.touched.familyMembers?.[index]?.year &&
                            formik.errors.familyMembers?.[index]?.year
                          }
                          disabled={loading === "submitting" || lockFields}
                        />
                        <DropDown
                          isPortal
                          dir={dir}
                          label={t("transportType.label")}
                          placeholder={t("transportType.placeholder")}
                          options={transportTypeOptions}
                          dropDownContainerClass={
                            classes.dropDownContainerClass
                          }
                          value={familyMember?.transportType || ""}
                          setValue={(val) =>
                            formik.setFieldValue(
                              `familyMembers[${index}].transportType`,
                              val
                            )
                          }
                          error={
                            formik.touched.familyMembers?.[index]
                              ?.transportType &&
                            formik.errors.familyMembers?.[index]?.transportType
                          }
                          disabled={loading === "submitting" || lockFields}
                        />
                        <div className={classes.booksContainer}>
                          <div className={classes.booksLabelContainer}>
                            <label>{t("books.label")}</label>
                            {!lockFields && (
                              <div
                                className={classes.addBookIcon}
                                onClick={() => {
                                  const updatedBooks = [
                                    ...familyMember.books,
                                    "",
                                  ];
                                  formik.setFieldValue(
                                    `familyMembers[${index}].books`,
                                    updatedBooks
                                  );
                                }}
                              >
                                <IoAddOutline size={18} />
                              </div>
                            )}
                          </div>
                          {familyMember?.books?.map((book, bookIndex) => (
                            <div
                              key={bookIndex}
                              className={classes.bookInputContainer}
                            >
                              <Input
                                dir={dir}
                                placeholder={t("books.placeholder", {
                                  number: bookIndex + 1,
                                })}
                                value={book}
                                setValue={(val) =>
                                  formik.setFieldValue(
                                    `familyMembers[${index}].books[${bookIndex}]`,
                                    val
                                  )
                                }
                                errorText={
                                  formik.touched.familyMembers?.[index]
                                    ?.books &&
                                  formik.errors.familyMembers?.[index]?.books
                                }
                                disabled={loading === "submitting" || lockFields}
                                type="text"
                              />
                              {!lockFields && familyMember.books.length > 1 && (
                                <div
                                  className={classes.removeBookIcon}
                                  onClick={() => {
                                    const updatedBooks =
                                      familyMember.books.filter(
                                        (_, i) => i !== bookIndex
                                      );
                                    formik.setFieldValue(
                                      `familyMembers[${index}].books`,
                                      updatedBooks
                                    );
                                  }}
                                >
                                  <BiTrash size={18} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
                <Input
                  dir={dir}
                  label={t("dob")}
                  placeholder={t("dobPlaceholder")}
                  type="date"
                  value={familyMember?.dob}
                  setValue={(val) =>
                    formik.setFieldValue(`familyMembers[${index}].dob`, val)
                  }
                  errorText={
                    formik.touched.familyMembers?.[index]?.dob &&
                    formik.errors.familyMembers?.[index]?.dob
                  }
                  disabled={loading === "submitting" || lockFields}
                  rightIcon={<IoCalendarOutline size={20} color="#B2B5BA" />}
                  rightIconClass={classes.calendarIcon}
                  max={moment().format("YYYY-MM-DD")}
                />
              </div>
            </Fragment>
          ))}
        </div>

        <div className={classes.ButtonContainer}>
          <Button
            variant="outlined"
            label={t("cancel")}
            onClick={() => {
              setShow(false);
              setModalData(null);
              formik.resetForm();
            }}
            disabled={loading === "submitting" || lockFields}
          />
          <Button
            variant="primary"
            label={t("confirm")}
            onClick={
              // modalData
              //   ? () => editResident(formik.values)
              () => {
                if (lockFields) {
                  if (!formik.values.roomNumber?.value) {
                    formik.setFieldTouched("roomNumber", true);
                    return;
                  }
                  handleSubmit(formik.values);
                  return;
                }
                const fieldsToValidate = formik.values.familyMembers.flatMap(
                  (member, index) => {
                    const requiredFields = [];
                    requiredFields.push(`familyMembers[${index}].fullName`);
                    if (
                      member.relationship?.value === "children" &&
                      member.schoolPlacement?.value === "placed"
                    ) {
                      requiredFields.push(`familyMembers[${index}].schoolName`);
                    }
                    return requiredFields;
                  }
                );

                // Validate main fullName
                validateMultiLingualForm({
                  fields: ["fullName", ...fieldsToValidate],
                  currentLanguage: activeLanguage,
                  formik: formik,
                });
              }
            }
            disabled={
              loading === "submitting" || loading === "updating" || translating
            }
            loading={loading === "submitting" || loading === "updating"}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
