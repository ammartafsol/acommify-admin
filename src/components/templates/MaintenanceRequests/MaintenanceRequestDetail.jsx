"use client";

import MenuComponent from "@/components/atoms/MenuComponent";
import NoDataFound from "@/components/atoms/NoDataFound/NoDataFound";
import RenderToast from "@/components/atoms/RenderToast";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import EditMaintenanceRequests from "@/components/organisms/Modals/EditMaintenanceRequests/EditMaintenanceRequests";
import AssignMaintenanceModal from "@/components/organisms/Modals/AssignMaintenanceModal";
import useAxios from "@/interceptor/axios-functions";
import { useRouter } from "@/i18n/navigation";
import useDirection from "@/resources/hooks/useDirection";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { imageUrl, isAdminOrBusinessOwner } from "@/resources/utils/helper";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { BsThreeDots } from "react-icons/bs";
import {
  FaFile,
  FaFileExcel,
  FaFileLines,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaFileZipper,
} from "react-icons/fa6";
import {
  LuArrowUp,
  LuCamera,
  LuCheck,
  LuClock,
  LuFileText,
  LuDoorOpen,
  LuHardHat,
  LuHistory,
  LuHouse,
  LuMapPin,
  LuMessageSquare,
  LuPlus,
  LuUser,
  LuUserCheck,
} from "react-icons/lu";
import { IoChevronBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import styles from "./detail.module.css";
import {
  formatMaintenanceRequest,
  getDocumentKey,
  getDocumentSrc,
  getHouseAndRoom,
  getLocationText,
  getPriority,
  getRequestCode,
  isStaffRequest,
} from "./formatMaintenanceRequest";

const STATUS_KEY = { "in-progress": "inprogress" };
const statusLabel = (t, status) =>
  status ? t(`tabs.${STATUS_KEY[status] || status}`) : "";
const ACTIVITY_ICONS = {
  created: LuPlus,
  assigned: LuUserCheck,
  status: LuHistory,
  note: LuMessageSquare,
  updated: LuHistory,
};

/** Audit trail: who did what, and when. */
function ActivityTimeline({ activity = [], t, locale }) {
  if (!activity.length) return null;
  const name = (by) => by?.fullName?.[locale] || by?.fullName?.en || t("timeline.someone");
  const assigneeText = (a) =>
    !a
      ? ""
      : a.type === "contractor"
        ? [a.name, a.company].filter(Boolean).join(" · ")
        : a.name;
  return (
    <>
      <h2 className={styles.sectionTitle}>{t("timeline.title")}</h2>
      <ol className={styles.timeline} data-testid="mr-timeline">
        {[...activity].reverse().map((entry, index) => {
          const Icon = ACTIVITY_ICONS[entry.action] || LuHistory;
          const who = name(entry.by);
          let text = "";
          if (entry.action === "created") text = t("timeline.created", { name: who });
          else if (entry.action === "assigned")
            text = t(
              entry.assignee?.type === "contractor" ? "timeline.assignedContractor" : "timeline.assigned",
              { name: who, assignee: assigneeText(entry.assignee) },
            );
          else if (entry.action === "status")
            text = t("timeline.status", {
              name: who,
              from: statusLabel(t, entry.fromStatus),
              to: statusLabel(t, entry.toStatus),
            });
          else text = t("timeline.note", { name: who });
          return (
            <li key={`${entry.at}-${index}`} data-action={entry.action}>
              <span className={`${styles.tlIcon} ${styles[`tl_${entry.action}`] || ""}`}>
                <Icon size={15} />
              </span>
              <div className={styles.tlBody}>
                <p className={styles.tlText}>{text}</p>
                <span className={styles.tlDate}>
                  {moment(entry.at).format("D MMM YYYY, HH:mm")}
                </span>
                {entry.note ? <p className={styles.tlNote}>{entry.note}</p> : null}
                {entry.documents?.length ? (
                  <div className={styles.tlPhotos}>
                    {entry.documents.map((doc) => (
                      <img
                        key={doc}
                        src={imageUrl(doc)}
                        alt=""
                        onClick={() => window.open(imageUrl(doc), "_blank")}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "heic",
  "heif",
  "jfif",
]);

const DOCUMENT_STYLES = {
  pdf: { Icon: FaFilePdf, label: "PDF", bg: "#FEF2F2", color: "#E11D48" },
  doc: { Icon: FaFileWord, label: "DOC", bg: "#EFF6FF", color: "#2563EB" },
  docx: { Icon: FaFileWord, label: "DOC", bg: "#EFF6FF", color: "#2563EB" },
  xls: { Icon: FaFileExcel, label: "XLS", bg: "#ECFDF3", color: "#16A34A" },
  xlsx: { Icon: FaFileExcel, label: "XLS", bg: "#ECFDF3", color: "#16A34A" },
  csv: { Icon: FaFileExcel, label: "CSV", bg: "#ECFDF3", color: "#059669" },
  ppt: { Icon: FaFilePowerpoint, label: "PPT", bg: "#FFF7ED", color: "#EA580C" },
  pptx: { Icon: FaFilePowerpoint, label: "PPT", bg: "#FFF7ED", color: "#EA580C" },
  txt: { Icon: FaFileLines, label: "TXT", bg: "#F8FAFC", color: "#475467" },
  zip: { Icon: FaFileZipper, label: "ZIP", bg: "#F5F3FF", color: "#7C3AED" },
  rar: { Icon: FaFileZipper, label: "RAR", bg: "#F5F3FF", color: "#7C3AED" },
};

function getFileExtension(value) {
  if (!value) return "";
  const clean = String(value).split("?")[0].split("#")[0];
  const name = decodeURIComponent(clean.split("/").pop() || "");
  const parts = name.split(".");
  if (parts.length < 2) return "";
  return parts.pop().toLowerCase();
}

function isImageSource(value) {
  const extension = getFileExtension(value);
  if (!extension) return true;
  return IMAGE_EXTENSIONS.has(extension);
}

function getDocumentStyle(value) {
  const extension = getFileExtension(value);
  return (
    DOCUMENT_STYLES[extension] || {
      Icon: FaFile,
      label: extension ? extension.toUpperCase() : "FILE",
      bg: "#F2F4F7",
      color: "#667085",
    }
  );
}

function FileTile({ src, name, isImage, onRemove, documentLabel, onImageFail }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = isImage && !failed;
  const documentStyle = getDocumentStyle(name || src);
  const Icon = documentStyle.Icon;

  return (
    <div className={styles.photo}>
      {showImage ? (
        <button
          type="button"
          className={styles.photoButton}
          onClick={() => window.open(src, "_blank")}
        >
          {!loaded ? <span className={styles.photoSkeleton} /> : null}
          <img
            src={src}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              onImageFail?.();
            }}
            className={loaded ? styles.photoReady : styles.photoHidden}
          />
        </button>
      ) : (
        <button
          type="button"
          className={styles.docTile}
          style={{ background: documentStyle.bg, color: documentStyle.color }}
          onClick={() => window.open(src, "_blank")}
        >
          <Icon size={28} />
          <span>{documentLabel}</span>
        </button>
      )}
      {onRemove ? (
        <button
          type="button"
          className={styles.removePhoto}
          onClick={onRemove}
          aria-label="Remove photo"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className={styles.sheet} aria-hidden="true">
      <div className={styles.skeletonBack} />
      <div className={styles.skeletonRow}>
        <div className={styles.skeletonPill} />
        <div className={styles.skeletonCode} />
      </div>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonInfo} />
      <div className={styles.skeletonInfo} />
      <div className={styles.skeletonInfo} />
      <div className={styles.skeletonHeading} />
      <div className={styles.photoSkeletonBlock} />
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonStatus} />
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonNote} />
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "completed", labelKey: "complete", className: "complete", icon: LuCheck },
  { value: "pending", labelKey: "pending", className: "pending", icon: LuClock },
  { value: "escalated", labelKey: "escalate", className: "escalate", icon: LuArrowUp },
];

function withLabel(label, value) {
  if (!value || value === "N/A") return "";
  if (String(value).toLowerCase().includes(String(label).toLowerCase())) {
    return value;
  }
  return `${label} ${value}`;
}

function reportedLabel(date, t) {
  const value = moment(date);
  if (!value.isValid()) return "";
  const time = value.format("HH:mm");
  if (value.isSame(moment(), "day")) {
    return t("mobile.reportedToday", { time });
  }
  if (value.isSame(moment().subtract(1, "day"), "day")) {
    return t("mobile.reportedYesterday", { time });
  }
  return t("mobile.reportedOn", { date: value.format("D MMM YYYY, HH:mm") });
}

export default function MaintenanceRequestDetail({ slug }) {
  const t = useTranslations("maintenanceRequestsPage");
  const locale = useLocale();
  const dir = useDirection();
  const router = useRouter();
  const { Get, Patch, Post } = useAxios();
  const { user, permissions = [] } = useSelector((state) => state.authReducer);

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [note, setNote] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [failedImages, setFailedImages] = useState({});
  const [editModal, setEditModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Staff who can only submit requests see their own submissions (read only)
  const canView =
    isAdminOrBusinessOwner(user?.role) ||
    permissions.includes("view-maintenance-requests");
  const canManage =
    isAdminOrBusinessOwner(user?.role) ||
    permissions.includes("approve-reject-maintenance-request");
  const mineOnly = !canView;

  useEffect(() => {
    const nextPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }));
    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [newFiles]);

  const loadRequest = async () => {
    setLoading(true);
    const { response } = await Get({
      route: mineOnly
        ? `maintenance-request/staff/my/detail/${slug}`
        : `admin/maintenance-request/detail/${slug}`,
    });
    const item = response?.data?.slug ? response.data : null;
    setRequest(item ? formatMaintenanceRequest(item, locale) : null);
    setLoading(false);
  };

  useEffect(() => {
    if (slug) loadRequest();
  }, [slug, locale, mineOnly]);

  useEffect(() => {
    if (!request) return;
    setNote("");
    setSelectedStatus(
      ["completed", "pending", "escalated"].includes(request.status)
        ? request.status
        : "",
    );
    setNewFiles([]);
  }, [request]);

  const priority = getPriority(request);
  const code = getRequestCode(request);
  const { house, room } = getHouseAndRoom(request || {});
  const houseLabel = withLabel(t("mobile.house"), house);
  const roomLabel = withLabel(t("mobile.room"), room);

  const isCompleted = request?.status === "completed";
  const isClosed = isCompleted || request?.status === "rejected";
  const staffSource = isStaffRequest(request);
  const isAssignee =
    !!request?.assignedTo &&
    (request.assignedTo._id === user?._id ||
      (request.assignedTo.userId && request.assignedTo.userId === user?.userId));
  // status buttons: managers; notes + photos: managers or the person doing the job
  const canChangeStatus = !mineOnly && canManage && !isClosed;
  const canAddNote = !mineOnly && (canManage || isAssignee) && !isClosed;
  const statusOptions = isCompleted
    ? STATUS_OPTIONS.filter((option) => option.value === "completed")
    : STATUS_OPTIONS;

  const canEdit =
    !isCompleted &&
    ((user?.role === "staff" &&
      (request?.assignedTo?.userId === user?.userId ||
        request?.assignedTo?._id === user?._id) &&
      request?.status === "in-progress") ||
      (isAdminOrBusinessOwner(user?.role) && request?.status !== "rejected"));

  const menuItems = [];
  if (!mineOnly && canManage && !isClosed) {
    menuItems.push({
      title: request?.assignedTo || request?.contractor?.name ? t("assign.reassign") : t("assign.action"),
      onClick: () => setAssignModal(true),
      style: { color: "var(--Black)", fontWeight: 500 },
    });
  }
  if (!mineOnly && permissions.includes("approve-reject-maintenance-request") && canEdit) {
    menuItems.push({
      title: t("actions.edit"),
      onClick: () => setEditModal(true),
      style: { color: "var(--Black)", fontWeight: 500 },
    });
  }
  if (!mineOnly && user?.role === "staff" && request?.status === "pending" &&
    permissions.includes("approve-reject-maintenance-request")) {
    menuItems.push({
      title: t("actions.acceptTask"),
      onClick: () => setConfirmAction("accept"),
      style: { color: "var(--Black)", fontWeight: 500 },
    });
  }
  if (isAdminOrBusinessOwner(user?.role) && request?.status === "pending") {
    menuItems.push({
      title: t("actions.rejectRequest"),
      onClick: () => setConfirmAction("reject"),
      style: { color: "var(--Red)", fontWeight: 500 },
    });
  }

  const acceptRequest = async () => {
    setSaving(true);
    const { response } = await Patch({
      route: `admin/maintenance-request/approve/reject/${request.slug}`,
      data: {
        staffSlug: user?.slug,
        status: "in-progress",
      },
    });
    if (response) {
      setConfirmAction(null);
      RenderToast({ type: "success", message: t("requestAcceptedSuccessfully") });
      await loadRequest();
    }
    setSaving(false);
  };

  const rejectRequest = async () => {
    setSaving(true);
    const { response } = await Patch({
      route: `admin/maintenance-request/approve/reject/${request.slug}`,
      data: {
        staffSlug: request?.user?.slug,
        status: "rejected",
      },
    });
    if (response) {
      setConfirmAction(null);
      RenderToast({ type: "success", message: t("requestRejectedSuccessfully") });
      await loadRequest();
    }
    setSaving(false);
  };

  const saveUpdate = async () => {
    const trimmedNote = note.trim();
    const statusChanged =
      canChangeStatus && selectedStatus && selectedStatus !== request.status;
    if (!statusChanged && !trimmedNote && newFiles.length === 0) {
      RenderToast({ type: "error", message: t("mobile.selectStatusOrNote") });
      return;
    }

    setSaving(true);
    let ok = true;
    if (statusChanged) {
      const { response } = await Patch({
        route: `admin/maintenance-request/update/${request.slug}`,
        data: { status: selectedStatus, ...(trimmedNote && { comment: trimmedNote }) },
      });
      ok = !!response;
    }
    // the note goes with the status change; otherwise (and for photos) it's its own entry
    if (ok && (newFiles.length || (trimmedNote && !statusChanged))) {
      const data = new FormData();
      if (trimmedNote && !statusChanged) data.append("note", trimmedNote);
      newFiles.forEach((file) => data.append("documents", file));
      const { response } = await Post({
        route: `admin/maintenance-request/note/${request.slug}`,
        data,
        isFormData: true,
      });
      ok = !!response;
    }

    if (ok) {
      RenderToast({
        type: "success",
        message: t("maintenanceRequestUpdatedSuccessfully"),
      });
      setNewFiles([]);
      setNote("");
      await loadRequest();
    }
    setSaving(false);
  };

  const submitter = request?.user;
  const submitterText = staffSource
    ? [
        t("staffSubmit.submittedByStaff", { name: request?.residentName }),
        submitter?.userId,
        submitter?.email,
      ]
        .filter(Boolean)
        .join(" · ")
    : request?.residentName;
  const infoRows = (
    staffSource
      ? [
          { icon: LuMapPin, text: getLocationText(request, t), key: "location" },
          { icon: LuUser, text: submitterText, key: "submitter" },
        ]
      : [
          houseLabel && { icon: LuHouse, text: houseLabel },
          roomLabel && { icon: LuDoorOpen, text: roomLabel },
          { icon: LuUser, text: submitterText, key: "submitter" },
        ]
  )
    .concat([{ icon: LuFileText, text: request?.shortDescription }])
    .filter((row) => row && row.text && row.text !== "N/A");

  const contractor = request?.contractor?.name ? request.contractor : null;
  const assignee = request?.assignedTo;

  return (
    <Container className={`containerFluid ${styles.main}`}>
      {loading ? (
        <DetailSkeleton />
      ) : !request ? (
        <div className={styles.state}>
          <NoDataFound text={t("mobile.notFound")} />
        </div>
      ) : (
        <div className={styles.sheet}>
          <div className={styles.topBar}>
            <button
              type="button"
              className={styles.back}
              onClick={() => router.push("/maintenance-requests")}
            >
              <IoChevronBack
                size={18}
                style={dir === "rtl" ? { transform: "rotate(180deg)" } : undefined}
              />
              {t("mobile.back")}
            </button>
            {menuItems.length > 0 ? (
              <MenuComponent
                portal
                items={menuItems}
                menuButton={
                  <button type="button" className={styles.moreBtn} aria-label="More">
                    <BsThreeDots size={18} />
                  </button>
                }
              />
            ) : (
              <span />
            )}
          </div>

          <div className={styles.priorityRow}>
            <span className={styles.badges}>
              {priority ? (
                <span className={`${styles.priority} ${styles[priority]}`}>
                  <i />
                  {t("mobile.priority", { level: t(`staffSubmit.priorities.${priority}`) })}
                </span>
              ) : null}
              <span
                className={staffSource ? styles.staffBadge : styles.residentBadge}
                data-source-badge={staffSource ? "staff" : "resident"}
              >
                {t(`staffSubmit.sources.${staffSource ? "staff" : "resident"}`)}
              </span>
            </span>
            <span className={styles.code}>{code}</span>
          </div>

          <h1 className={styles.title}>{request.issueCategory}</h1>
          <p className={styles.reported}>{reportedLabel(request.createdAt, t)}</p>

          <div className={styles.infoList}>
            {infoRows.map((row) => {
              const Icon = row.icon;
              return (
                <div className={styles.infoRow} key={row.key || row.text} data-row={row.key}>
                  <span className={styles.iconBox}>
                    <Icon size={18} />
                  </span>
                  <p>{row.text}</p>
                </div>
              );
            })}
          </div>

          {assignee || contractor ? (
            <div className={styles.assigneeCard} data-testid="mr-assignee">
              <span className={styles.iconBox}>
                {contractor ? <LuHardHat size={18} /> : <LuUserCheck size={18} />}
              </span>
              <div>
                <span>{contractor ? t("assign.assignedContractor") : t("assign.assignedStaff")}</span>
                <strong>
                  {contractor
                    ? [contractor.name, contractor.company].filter(Boolean).join(" · ")
                    : assignee?.fullName?.[locale] || assignee?.fullName?.en}
                </strong>
                <em>
                  {(contractor
                    ? [contractor.phone, contractor.email]
                    : [
                        assignee?.callingCode && assignee?.phoneNumber
                          ? `${assignee.callingCode} ${assignee.phoneNumber}`
                          : "",
                        assignee?.email,
                      ]
                  )
                    .filter(Boolean)
                    .join(" · ")}
                </em>
              </div>
            </div>
          ) : null}

          <h2 className={styles.sectionTitle}>
            {(() => {
              const files = request.documents || [];
              if (!files.length) return t("mobile.photos");
              const kinds = files.map((doc) => {
                const raw = getDocumentSrc(doc);
                const src = imageUrl(raw);
                return isImageSource(raw) && !failedImages[src];
              });
              const documentCount = kinds.filter((isPhoto) => !isPhoto).length;
              if (!documentCount) return t("mobile.photos");
              if (documentCount === files.length) {
                return files.length > 1
                  ? t("mobile.documents")
                  : t("mobile.document");
              }
              return t("mobile.photosAndDocuments");
            })()}
          </h2>
          <div className={styles.photos}>
            {(request.documents || []).map((doc, index) => {
              const raw = getDocumentSrc(doc);
              const src = imageUrl(raw);
              return (
                <FileTile
                  key={`${src}-${index}`}
                  src={src}
                  name={raw}
                  isImage={isImageSource(raw) && !failedImages[src]}
                  documentLabel={t("mobile.document")}
                  onImageFail={() =>
                    setFailedImages((current) => ({ ...current, [src]: true }))
                  }
                />
              );
            })}
            {previews.map((preview, index) => (
              <FileTile
                key={preview.url}
                src={preview.url}
                name={preview.name}
                isImage={
                  preview.type
                    ? preview.type.startsWith("image/")
                    : isImageSource(preview.name)
                }
                documentLabel={t("mobile.document")}
                onRemove={() =>
                  setNewFiles((current) =>
                    current.filter((_, fileIndex) => fileIndex !== index),
                  )
                }
              />
            ))}
            {canAddNote ? (
              <label className={styles.addPhoto}>
                <LuCamera size={20} />
                {t("mobile.addPhoto")}
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  data-testid="mr-note-file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setNewFiles((current) => [...current, file]);
                    event.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>

          {canChangeStatus || isCompleted ? (
          <>
          <h2 className={styles.sectionTitle}>{t("mobile.updateStatus")}</h2>
          <div
            className={`${styles.statusGrid} ${
              isCompleted ? styles.statusGridLocked : ""
            }`}
          >
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.statusBtn} ${styles[option.className]} ${
                    selectedStatus === option.value || isCompleted
                      ? styles.selected
                      : ""
                  } ${isCompleted ? styles.statusLocked : ""}`}
                  onClick={() => {
                    if (!isCompleted) setSelectedStatus(option.value);
                  }}
                  disabled={isCompleted}
                >
                  <span>
                    <Icon size={16} />
                  </span>
                  {t(`mobile.${option.labelKey}`)}
                </button>
              );
            })}
          </div>

          </>
          ) : null}

          {isClosed || !canAddNote ? (
            request.comment && !(request.activity || []).length ? (
              <>
                <h2 className={styles.sectionTitle}>{t("commentModal.comment")}</h2>
                <p className={styles.commentText}>{request.comment}</p>
              </>
            ) : null
          ) : (
            <>
              <h2 className={styles.sectionTitle}>{t("mobile.addNote")}</h2>
              <div className={styles.noteWrap}>
                <textarea
                  className={styles.note}
                  maxLength={500}
                  value={note}
                  placeholder={t("mobile.notePlaceholder")}
                  onChange={(event) => setNote(event.target.value)}
                />
                <span className={styles.counter}>{note.length}/500</span>
              </div>

              <button
                type="button"
                className={styles.save}
                onClick={saveUpdate}
                disabled={saving}
              >
                {t("mobile.saveUpdate")}
              </button>
            </>
          )}

          <ActivityTimeline activity={request.activity} t={t} locale={locale} />
        </div>
      )}

      {assignModal && request && (
        <AssignMaintenanceModal
          show={assignModal}
          setShow={setAssignModal}
          request={request}
          onSaved={loadRequest}
        />
      )}

      {editModal && permissions.includes("approve-reject-maintenance-request") && (
        <EditMaintenanceRequests
          title={t("assignTaskTitle")}
          show={editModal}
          setShow={setEditModal}
          data={request}
          onSave={loadRequest}
        />
      )}

      {confirmAction && (
        <AreYouSureModal
          show={Boolean(confirmAction)}
          setShow={() => setConfirmAction(null)}
          loading={saving}
          onConfirm={() => {
            if (confirmAction === "accept") acceptRequest();
            if (confirmAction === "reject") rejectRequest();
          }}
        />
      )}
    </Container>
  );
}
