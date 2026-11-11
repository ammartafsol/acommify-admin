"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import RenderToast from "@/components/atoms/RenderToast";
import { TextArea } from "@/components/atoms/TextArea/TextArea";
import DropDown from "@/components/molecules/DropDown/DropDown";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LuHardHat, LuUserCheck } from "react-icons/lu";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import styles from "./styles.module.css";

/** Manager: give a maintenance job to a staff member or an external contractor. */
export default function AssignMaintenanceModal({ show, setShow, request, onSaved }) {
  const t = useTranslations("maintenanceRequestsPage");
  const locale = useLocale();
  const { Get, Patch } = useAxios();

  const [assignTo, setAssignTo] = useState(request?.contractor?.name ? "contractor" : "staff");
  const [staffOptions, setStaffOptions] = useState([]);
  const [staff, setStaff] = useState(
    request?.assignedTo?.slug
      ? {
          value: request.assignedTo.slug,
          label: request.assignedTo.fullName?.[locale] || request.assignedTo.fullName?.en || "",
        }
      : null,
  );
  const [contractor, setContractor] = useState({
    name: request?.contractor?.name || "",
    company: request?.contractor?.company || "",
    phone: request?.contractor?.phone || "",
    email: request?.contractor?.email || "",
  });
  const [note, setNote] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams({ purpose: "maintenance-request", status: "active" });
      const { response } = await Get({ route: `admin/staff/assign?${params}` });
      if (response?.data)
        setStaffOptions(
          response.data.map((s) => ({
            value: s.slug,
            label: s.fullName?.[locale] || s.fullName?.en || s.slug,
          })),
        );
      setLoadingStaff(false);
    })();
  }, []);

  const emailOk = !contractor.email || /^\S+@\S+\.\S+$/.test(contractor.email);
  const errors = {
    staff: assignTo === "staff" && !staff ? t("assign.errors.staff") : "",
    name:
      assignTo === "contractor" && contractor.name.trim().length < 2
        ? t("assign.errors.contractorName")
        : "",
    email: assignTo === "contractor" && !emailOk ? t("assign.errors.email") : "",
  };
  const err = (k) => (touched ? errors[k] : "");
  const setC = (k, v) => setContractor((c) => (c[k] === v ? c : { ...c, [k]: v }));

  const save = async () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setSaving(true);
    const data =
      assignTo === "staff"
        ? { assignTo, staffSlug: staff.value }
        : {
            assignTo,
            contractor: Object.fromEntries(
              Object.entries(contractor)
                .map(([k, v]) => [k, v.trim()])
                .filter(([, v]) => v),
            ),
          };
    if (note.trim()) data.note = note.trim();
    const { response } = await Patch({
      route: `admin/maintenance-request/assign/${request.slug}`,
      data,
    });
    setSaving(false);
    if (response) {
      RenderToast({ type: "success", message: t("assign.saved") });
      setShow(false);
      onSaved?.();
    }
  };

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      maxWidth="600px"
      padding="20px 28px"
      header={t("assign.title")}
    >
      <div className={styles.form} data-testid="assign-mr-form">
        <div className={styles.switch} role="radiogroup">
          {[
            { value: "staff", icon: LuUserCheck },
            { value: "contractor", icon: LuHardHat },
          ].map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={assignTo === value}
              data-assign={value}
              className={assignTo === value ? styles.active : ""}
              onClick={() => setAssignTo(value)}
            >
              <Icon size={18} />
              <span>
                <strong>{t(`assign.${value}`)}</strong>
                <em>{t(`assign.${value}Hint`)}</em>
              </span>
            </button>
          ))}
        </div>

        {assignTo === "staff" ? (
          <DropDown
            isPortal
            label={t("assign.staffMember")}
            placeholder={loadingStaff ? t("staffSubmit.loading") : t("assign.staffPlaceholder")}
            options={staffOptions}
            value={staff}
            setValue={setStaff}
            error={err("staff")}
            disabled={loadingStaff}
          />
        ) : (
          <div className={styles.grid}>
            <Input
              label={t("assign.contractorName")}
              placeholder={t("assign.contractorNamePlaceholder")}
              value={contractor.name}
              setValue={(v) => setC("name", v.slice(0, 120))}
              errorText={err("name")}
            />
            <Input
              label={t("assign.company")}
              placeholder={t("assign.companyPlaceholder")}
              value={contractor.company}
              setValue={(v) => setC("company", v.slice(0, 120))}
            />
            <Input
              label={t("assign.phone")}
              placeholder="+44 7700 900000"
              value={contractor.phone}
              setValue={(v) => setC("phone", v.slice(0, 40))}
            />
            <Input
              label={t("assign.email")}
              placeholder="name@company.com"
              value={contractor.email}
              setValue={(v) => setC("email", v.slice(0, 120))}
              errorText={err("email")}
            />
          </div>
        )}

        <TextArea
          label={t("assign.note")}
          placeholder={t("assign.notePlaceholder")}
          value={note}
          setter={(v) => setNote(v.slice(0, 1000))}
        />

        <div className={styles.actions}>
          <Button label={t("buttons.cancel")} variant="outlined" onClick={() => setShow(false)} />
          <Button
            label={t("assign.save")}
            variant="primary"
            onClick={save}
            disabled={saving}
            loading={saving}
            showSpinner
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
