"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import DropDown from "@/components/molecules/DropDown/DropDown";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  LuBuilding2,
  LuCamera,
  LuHouse,
  LuTrees,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { useSelector } from "react-redux";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import styles from "./styles.module.css";

const LOCATION_TYPES = [
  { value: "property", icon: LuHouse },
  { value: "communal", icon: LuUsers },
  { value: "building", icon: LuBuilding2 },
  { value: "external", icon: LuTrees },
];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const MAX_FILES = 5;
const MAX_SIZE = 5_000_000;

const EMPTY = {
  locationType: "property",
  property: null,
  locationName: "",
  area: "",
  category: null,
  description: "",
  priority: "medium",
};

/**
 * Staff "Submit Maintenance Request" form. The request enters the normal
 * maintenance workflow (pending) linked to a property or a location — no
 * resident is needed. Date / time and submitter are recorded automatically.
 */
export default function SubmitMaintenanceRequestModal({ show, setShow, onSubmitted }) {
  const t = useTranslations("maintenanceRequestsPage");
  const locale = useLocale();
  const { Get, Post } = useAxios();
  const { user } = useSelector((state) => state.authReducer);

  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [options, setOptions] = useState({ categories: [], properties: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      const { response } = await Get({ route: "maintenance-request/staff/options" });
      if (response?.data) setOptions(response.data);
      setLoadingOptions(false);
    })();
  }, []);

  useEffect(() => {
    const next = files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);

  // No-op when unchanged: the shared DropDown remounts on every render, so a
  // needless re-render (e.g. an input's trim on blur) would swallow the next click.
  const set = (key, value) =>
    setForm((f) => (f[key] === value ? f : { ...f, [key]: value }));

  const categoryOptions = useMemo(
    () =>
      (options.categories || []).map((c) => ({
        value: c.slug,
        label: c.name?.[locale] || c.name?.en || c.slug,
      })),
    [options.categories, locale],
  );
  const propertyOptions = useMemo(
    () =>
      (options.properties || []).map((p) => ({
        value: p.slug,
        label: `${p.accommodationNumber}${p.type ? ` · ${t(`staffSubmit.propertyTypes.${p.type}`)}` : ""}`,
      })),
    [options.properties, t],
  );

  const isProperty = form.locationType === "property";
  const errors = {
    property: isProperty && !form.property ? t("staffSubmit.errors.property") : "",
    locationName:
      !isProperty && !form.locationName.trim() ? t("staffSubmit.errors.locationName") : "",
    category: !form.category ? t("staffSubmit.errors.category") : "",
    description:
      form.description.trim().length < 5 ? t("staffSubmit.errors.description") : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const err = (key) => (touched ? errors[key] : "");

  const addFiles = (list) => {
    const picked = Array.from(list || []);
    const tooBig = picked.filter((f) => f.size > MAX_SIZE);
    if (tooBig.length) RenderToast({ type: "error", message: t("staffSubmit.errors.fileSize") });
    const ok = picked.filter((f) => f.size <= MAX_SIZE && f.type.startsWith("image/"));
    setFiles((current) => {
      const next = [...current, ...ok];
      if (next.length > MAX_FILES)
        RenderToast({ type: "error", message: t("staffSubmit.errors.maxFiles", { count: MAX_FILES }) });
      return next.slice(0, MAX_FILES);
    });
  };

  const submit = async () => {
    setTouched(true);
    if (hasErrors) return;
    setSaving(true);
    const data = new FormData();
    data.append("locationType", form.locationType);
    if (isProperty) data.append("accommodationSlug", form.property.value);
    else data.append("locationName", form.locationName.trim());
    if (form.area.trim()) data.append("area", form.area.trim());
    data.append("categorySlug", form.category.value);
    data.append("description", form.description.trim());
    data.append("priority", form.priority);
    files.forEach((file) => data.append("documents", file));

    const { response } = await Post({
      route: "maintenance-request/staff/create",
      data,
      isFormData: true,
    });
    setSaving(false);
    if (response) {
      RenderToast({ type: "success", message: t("staffSubmit.submitted") });
      setShow(false);
      onSubmitted?.(response.data);
    }
  };

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      maxWidth="720px"
      padding="20px 28px"
      header={t("staffSubmit.title")}
    >
      <div className={styles.form} data-testid="staff-mr-form">
        <p className={styles.intro}>{t("staffSubmit.intro")}</p>

        {/* Request location */}
        <div className={styles.field}>
          <span className={styles.label}>{t("staffSubmit.location")}</span>
          <div className={styles.locationGrid} role="radiogroup">
            {LOCATION_TYPES.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={form.locationType === value}
                data-location={value}
                className={`${styles.locationCard} ${form.locationType === value ? styles.active : ""}`}
                onClick={() => set("locationType", value)}
              >
                <Icon size={20} />
                <span>{t(`staffSubmit.locationTypes.${value}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          {isProperty ? (
            <DropDown
              isPortal
              label={t("staffSubmit.property")}
              placeholder={
                loadingOptions ? t("staffSubmit.loading") : t("staffSubmit.propertyPlaceholder")
              }
              options={propertyOptions}
              value={form.property}
              setValue={(v) => set("property", v)}
              error={err("property")}
              disabled={loadingOptions}
              dropDownContainerClass={styles.dropdown}
            />
          ) : (
            <Input
              label={t("staffSubmit.locationName")}
              placeholder={t(`staffSubmit.locationNamePlaceholder.${form.locationType}`)}
              value={form.locationName}
              setValue={(v) => set("locationName", v.slice(0, 120))}
              errorText={err("locationName")}
            />
          )}
          <Input
            label={t("staffSubmit.area")}
            placeholder={t("staffSubmit.areaPlaceholder")}
            value={form.area}
            setValue={(v) => set("area", v.slice(0, 120))}
          />
        </div>

        <DropDown
          isPortal
          label={t("staffSubmit.category")}
          placeholder={
            loadingOptions ? t("staffSubmit.loading") : t("staffSubmit.categoryPlaceholder")
          }
          options={categoryOptions}
          value={form.category}
          setValue={(v) => set("category", v)}
          error={err("category")}
          disabled={loadingOptions}
          dropDownContainerClass={styles.dropdown}
        />

        <div className={styles.field}>
          <TextArea
            label={t("staffSubmit.description")}
            placeholder={t("staffSubmit.descriptionPlaceholder")}
            value={form.description}
            setter={(v) => set("description", v.slice(0, 2000))}
          />
          {err("description") ? <span className={styles.error}>{err("description")}</span> : null}
        </div>

        {/* Priority */}
        <div className={styles.field}>
          <span className={styles.label}>{t("staffSubmit.priority")}</span>
          <div className={styles.priorityRow} role="radiogroup">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={form.priority === p}
                data-priority={p}
                className={`${styles.priorityChip} ${styles[p]} ${form.priority === p ? styles.active : ""}`}
                onClick={() => set("priority", p)}
              >
                <i />
                {t(`staffSubmit.priorities.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className={styles.field}>
          <span className={styles.label}>
            {t("staffSubmit.photos")}{" "}
            <em>{t("staffSubmit.photosHint", { count: MAX_FILES })}</em>
          </span>
          <div className={styles.photos}>
            {previews.map((p, i) => (
              <div key={p.url} className={styles.photo}>
                <img src={p.url} alt={p.name} />
                <button
                  type="button"
                  aria-label={t("staffSubmit.removePhoto")}
                  onClick={() => setFiles((cur) => cur.filter((_, idx) => idx !== i))}
                >
                  <LuX size={14} />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES ? (
              <label className={styles.addPhoto}>
                <LuCamera size={20} />
                {t("staffSubmit.addPhoto")}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  data-testid="staff-mr-files"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>

        {/* Recorded automatically */}
        <div className={styles.auto}>
          <div>
            <span>{t("staffSubmit.submittedBy")}</span>
            <strong>{user?.fullName?.[locale] || user?.fullName?.en || "—"}</strong>
          </div>
          <div>
            <span>{t("staffSubmit.dateTime")}</span>
            <LiveClock />
          </div>
          <p>{t("staffSubmit.autoNote")}</p>
        </div>

        <div className={styles.actions}>
          <Button label={t("buttons.cancel")} variant="outlined" onClick={() => setShow(false)} />
          <Button
            label={t("staffSubmit.submit")}
            variant="primary"
            onClick={submit}
            disabled={saving}
            loading={saving}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}

/** Current date / time, ticking on its own so the form doesn't re-render. */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return <strong>{moment(now).format("D MMM YYYY, HH:mm")}</strong>;
}
