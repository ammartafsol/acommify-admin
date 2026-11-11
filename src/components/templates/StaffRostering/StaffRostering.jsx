"use client";
import Button from "@/components/atoms/Button";
import RenderToast from "@/components/atoms/RenderToast";
import SearchInput from "@/components/molecules/SearchInput/SearchInput";
import StaffSubNav from "@/components/molecules/StaffSubNav/StaffSubNav";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { imageUrl, mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import {
  LuCalendarDays,
  LuCircleAlert,
  LuCopy,
  LuHistory,
  LuMessageSquare,
  LuPlus,
  LuSave,
  LuSend,
} from "react-icons/lu";
import { useSelector } from "react-redux";
import {
  addDays,
  formatDayDate,
  formatDayName,
  formatWeekLabel,
  getInitials,
  getWeekDays,
  getWeekStart,
  isSameDay,
} from "../StaffAttendance/attendanceUtils";
import RosterCellModal from "./RosterCellModal";
import RequestsPanel from "./RequestsPanel";
import RosterHistoryModal from "./RosterHistoryModal";
import {
  ENTRY_CODES,
  entryKey,
  entryMinutes,
  formatHours,
  isPendingRo,
  isWorking,
  signature,
  toDayKey,
  cleanEntry,
  toEntryMap,
} from "./rosterUtils";
import styles from "./styles.module.css";

const AVATAR_COLORS = [
  ["#e0f2fe", "#0369a1"],
  ["#ede9fe", "#6d28d9"],
  ["#dcfce7", "#15803d"],
  ["#ffedd5", "#c2410c"],
  ["#fce7f3", "#be185d"],
  ["#e0e7ff", "#4338ca"],
];

function avatarColor(seed = "") {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function StaffRostering() {
  const t = useTranslations("staffRosterPage");
  const locale = useLocale();
  const { Get, Put, Post, Patch } = useAxios();
  const { permissions = [], user } = useSelector((state) => state.authReducer);
  const canManage =
    user?.role === "admin" || permissions.includes("manage-staff-roster");

  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [staff, setStaff] = useState([]);
  const [roster, setRoster] = useState(null);
  const [requests, setRequests] = useState([]); // staff day-off (R/O) requests
  const [holidays, setHolidays] = useState([]); // centre holidays / bank holidays this week
  const [reviewingId, setReviewingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previousWeek, setPreviousWeek] = useState(null);
  const [savedEntries, setSavedEntries] = useState({});
  const [entries, setEntries] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState("loading");
  const [editing, setEditing] = useState(null); // { staff, day }
  const [confirm, setConfirm] = useState(null); // { type: "issue" | "leave" | "copy", ... }
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const requestId = useRef(0);

  const weekKey = toDayKey(weekStart);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const dayKeys = useMemo(() => weekDays.map(toDayKey), [weekDays]);
  const today = new Date();

  const isDirty = signature(entries) !== signature(savedEntries);
  const entryList = Object.values(entries);
  const pendingRo = entryList.filter(isPendingRo);
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingRequestByKey = Object.fromEntries(
    pendingRequests.map((r) => [entryKey(String(r.staff), r.date), r]),
  );
  const toReview = pendingRo.length + pendingRequests.length;
  const holidayByDay = Object.fromEntries(holidays.map((h) => [h.date, h]));
  const isIssued = roster?.status === "issued";
  const hasUnissued = isIssued && (roster?.hasUnissuedChanges || isDirty);
  const canIssue = entryList.length > 0 && (!isIssued || hasUnissued);

  async function getData(week = weekStart) {
    const current = ++requestId.current;
    setLoading("loading");
    const { response } = await Get({
      route: `staff-roster/week?weekStart=${toDayKey(week)}`,
    });
    if (current !== requestId.current) return;
    if (response?.data) {
      const map = toEntryMap(response.data.roster?.entries);
      setStaff(Array.isArray(response.data.staff) ? response.data.staff : []);
      setRoster(response.data.roster || null);
      setRequests(Array.isArray(response.data.requests) ? response.data.requests : []);
      setHolidays(Array.isArray(response.data.holidays) ? response.data.holidays : []);
      setPreviousWeek(response.data.previousWeek || null);
      setSavedEntries(map);
      setEntries(map);
    } else {
      setStaff([]);
      setRoster(null);
      setRequests([]);
      setHolidays([]);
      setSavedEntries({});
      setEntries({});
    }
    setLoading("");
  }

  useEffect(() => {
    getData(weekStart);
  }, [weekKey]);

  // Warn before leaving the page with unsaved roster changes
  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  function changeWeek(next) {
    if (isDirty) setConfirm({ type: "leave", week: next });
    else setWeekStart(next);
  }

  function applyCell(staffId, keys, entry) {
    const isSelf = String(staffId) === String(user?._id);
    setEntries((prev) => {
      const next = { ...prev };
      keys.forEach((day) => {
        const key = entryKey(staffId, day);
        // Never overwrite your own R/O that another manager already reviewed
        const current = prev[key];
        if (isSelf && current?.type === "ro" && current.roDecision && current.roDecision !== "pending")
          return;
        if (!entry) delete next[key];
        else next[key] = { ...entry, staff: staffId, date: day };
      });
      return next;
    });
  }

  function afterSave(data, message) {
    const map = toEntryMap(data?.entries);
    setRoster(data || null);
    setSavedEntries(map);
    setEntries(map);
    if (message) RenderToast({ type: "success", message });
  }

  async function saveDraft() {
    setLoading("save");
    const { response } = await Put({
      route: "staff-roster/week",
      data: { weekStart: weekKey, entries: Object.values(entries) },
    });
    if (response?.data) afterSave(response.data, t("toast.saved"));
    setLoading("");
  }

  /** Approve / decline a staff request. The server updates the roster; keep local edits. */
  async function reviewRequest(request, decision, note = "") {
    setReviewingId(request._id);
    const { response } = await Patch({
      route: `staff-roster/requests/${request._id}`,
      data: { decision, note },
    });
    if (response?.data) {
      const { request: saved, entry, roster: savedRoster } = response.data;
      setRequests((prev) => prev.map((r) => (r._id === saved._id ? saved : r)));
      if (entry) {
        const clean = cleanEntry(entry);
        const key = entryKey(clean.staff, clean.date);
        setEntries((prev) => ({ ...prev, [key]: clean }));
        setSavedEntries((prev) => ({ ...prev, [key]: clean }));
      }
      if (savedRoster) setRoster(savedRoster);
      RenderToast({
        type: "success",
        message:
          decision === "approved" ? t("requests.toastApproved") : t("requests.toastDeclined"),
      });
    }
    setReviewingId(null);
    return !!response;
  }

  function requestIssue() {
    if (pendingRequests.length) {
      RenderToast({
        type: "error",
        message: t("requests.block", { count: pendingRequests.length }),
      });
      document.getElementById("roster-requests")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (pendingRo.length) {
      setShowPendingOnly(true);
      RenderToast({
        type: "error",
        message: t("pendingRoBlock", { count: pendingRo.length }),
      });
      return;
    }
    setConfirm({ type: "issue" });
  }

  async function issueRoster() {
    setLoading("issue");
    const { response } = await Post({
      route: "staff-roster/issue",
      data: { weekStart: weekKey, entries: Object.values(entries) },
    });
    if (response?.data) {
      afterSave(
        response.data,
        isIssued ? t("toast.reissued") : t("toast.issued"),
      );
      setConfirm(null);
    }
    setLoading("");
  }

  async function copyPreviousWeek() {
    setLoading("copy");
    const { response } = await Get({
      route: `staff-roster/previous-week?weekStart=${weekKey}`,
    });
    if (response?.data) {
      const copied = toEntryMap(response.data.entries);
      // Only fill empty days, never overwrite what is already planned
      const additions = Object.fromEntries(
        Object.entries(copied).filter(([key]) => !entries[key]),
      );
      const added = Object.keys(additions).length;
      if (added) setEntries((prev) => ({ ...additions, ...prev }));
      RenderToast({
        type: added ? "success" : "info",
        message: added
          ? t("toast.copied", { count: added })
          : t("toast.nothingToCopy"),
      });
    }
    setConfirm(null);
    setLoading("");
  }

  // ---------- Rows & totals ----------

  const staffName = (s) =>
    s?.fullName?.[locale] || s?.fullName?.en || s?.email || "-";

  const rows = staff
    .map((s) => {
      const id = String(s._id);
      const days = dayKeys.map((day) => entries[entryKey(id, day)] || null);
      return {
        staff: s,
        id,
        name: staffName(s),
        days,
        total: days.reduce((sum, e) => sum + entryMinutes(e), 0),
        hasPending:
          days.some(isPendingRo) ||
          dayKeys.some((day) => pendingRequestByKey[entryKey(id, day)]),
      };
    })
    .filter((row) => {
      if (showPendingOnly && !row.hasPending) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [row.name, row.staff?.userId, row.staff?.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

  const dayTotals = dayKeys.map((day) =>
    staff.reduce(
      (acc, s) => {
        const e = entries[entryKey(String(s._id), day)];
        if (isWorking(e)) acc.onShift += 1;
        acc.minutes += entryMinutes(e);
        return acc;
      },
      { minutes: 0, onShift: 0 },
    ),
  );
  const weekTotal = dayTotals.reduce((sum, d) => sum + d.minutes, 0);
  const staffOnRoster = new Set(entryList.map((e) => e.staff)).size;

  // ---------- Status ----------

  let statusTone = "draft";
  let statusLabel = t("status.draft");
  let statusText = roster ? t("status.draftText") : t("status.newText");
  if (isIssued && !hasUnissued) {
    statusTone = "issued";
    statusLabel = t("status.issued");
    statusText = t("status.issuedText", {
      date: new Date(roster.issuedAt).toLocaleString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      name:
        roster?.issuedBy?.fullName?.[locale] ||
        roster?.issuedBy?.fullName?.en ||
        "-",
    });
  } else if (isIssued) {
    statusTone = "changed";
    statusLabel = t("status.changed");
    statusText = t("status.changedText");
  }

  const isBusy = loading !== "";

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <StaffSubNav />

      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>

        <div className={styles.weekSelector}>
          <button
            type="button"
            className={styles.weekBtn}
            onClick={() => changeWeek(addDays(weekStart, -7))}
            aria-label={t("previousWeek")}
          >
            <IoChevronBack size={16} className={styles.flipRtl} />
          </button>
          <button
            type="button"
            className={styles.weekLabel}
            onClick={() => changeWeek(getWeekStart())}
            title={t("goToCurrentWeek")}
          >
            <LuCalendarDays size={16} />
            <span>{formatWeekLabel(weekStart, locale)}</span>
          </button>
          <button
            type="button"
            className={styles.weekBtn}
            onClick={() => changeWeek(addDays(weekStart, 7))}
            aria-label={t("nextWeek")}
          >
            <IoChevronForward size={16} className={styles.flipRtl} />
          </button>
        </div>
      </div>

      {/* Status + actions */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <span className={mergeClass(styles.statusBadge, styles[statusTone])}>
            <i />
            {statusLabel}
          </span>
          <p>
            {statusText}
            {isDirty && (
              <strong className={styles.unsaved}> {t("status.unsaved")}</strong>
            )}
          </p>
        </div>

        {canManage && (
          <div className={styles.actions}>
            {roster?.version > 0 && (
              <Button
                label={t("history.button", { version: roster.version })}
                variant="outlined"
                leftIcon={<LuHistory size={16} />}
                onClick={() => setShowHistory(true)}
                disabled={isBusy}
                className={styles.actionBtn}
              />
            )}
            {previousWeek?.hasEntries && (
              <Button
                label={t("actions.copyPrevious")}
                variant="outlined"
                leftIcon={<LuCopy size={16} />}
                onClick={() => setConfirm({ type: "copy" })}
                disabled={isBusy || !staff.length}
                className={styles.actionBtn}
              />
            )}
            <Button
              label={
                loading === "save"
                  ? t("actions.saving")
                  : t("actions.saveDraft")
              }
              variant="outlined"
              leftIcon={<LuSave size={16} />}
              onClick={saveDraft}
              disabled={isBusy || !isDirty}
              className={styles.actionBtn}
            />
            <Button
              label={isIssued ? t("actions.reissue") : t("actions.issue")}
              variant="primary"
              leftIcon={<LuSend size={16} />}
              onClick={requestIssue}
              disabled={isBusy || !canIssue}
              className={styles.actionBtn}
            />
          </div>
        )}
      </div>

      {!canManage && <p className={styles.readOnly}>{t("readOnly")}</p>}
      {!canManage && roster?.version > 0 && (
        <div>
          <Button
            label={t("history.button", { version: roster.version })}
            variant="outlined"
            leftIcon={<LuHistory size={16} />}
            onClick={() => setShowHistory(true)}
            className={styles.actionBtn}
          />
        </div>
      )}

      <div id="roster-requests">
        <RequestsPanel
          requests={requests}
          staffName={(id) => staffName(staff.find((s) => String(s._id) === String(id)))}
          canManage={canManage}
          busyId={reviewingId}
          onReview={reviewRequest}
          currentUserId={user?._id}
        />
      </div>

      {pendingRo.length > 0 && (
        <div className={styles.alert} role="status">
          <LuCircleAlert size={20} />
          <p>{t("pendingRoAlert", { count: pendingRo.length })}</p>
          <button type="button" onClick={() => setShowPendingOnly((v) => !v)}>
            {showPendingOnly ? t("showAllStaff") : t("showPending")}
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <b className={mergeClass(styles.code, styles.code_shift)}>08:00</b>
            {t("legend.shift")}
          </span>
          {["ro", "hol", "bhol", "off"].map((type) => (
            <span key={type} className={styles.legendItem}>
              <b className={mergeClass(styles.code, styles[`code_${type}`])}>
                {ENTRY_CODES[type]}
              </b>
              {t(`legend.${type}`)}
            </span>
          ))}
        </div>

        <div className={styles.search}>
          <SearchInput
            placeholder={t("searchPlaceholder")}
            value={search}
            setValue={setSearch}
          />
        </div>
      </div>

      <div className={styles.summary}>
        <div>
          <span>{t("summary.staff")}</span>
          <strong>
            {staffOnRoster} / {staff.length}
          </strong>
        </div>
        <div>
          <span>{t("summary.hours")}</span>
          <strong>{formatHours(weekTotal)}</strong>
        </div>
        <div>
          <span>{t("summary.pending")}</span>
          <strong className={toReview ? styles.warnText : ""}>
            {toReview}
          </strong>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.nameCol}>{t("table.staff")}</th>
                {weekDays.map((day) => (
                  <th
                    key={toDayKey(day)}
                    className={mergeClass(
                      styles.dayCol,
                      isSameDay(day, today) ? styles.today : "",
                    )}
                  >
                    <span className={styles.dayName}>
                      {formatDayName(day, locale)}
                    </span>
                    <span className={styles.dayDate}>
                      {formatDayDate(day, locale)}
                    </span>
                    {holidayByDay[toDayKey(day)] && (
                      <span
                        className={mergeClass(
                          styles.holidayTag,
                          styles[`holiday_${holidayByDay[toDayKey(day)].type}`],
                        )}
                        title={
                          holidayByDay[toDayKey(day)].name?.[locale] ||
                          holidayByDay[toDayKey(day)].name?.en
                        }
                      >
                        <b>
                          {holidayByDay[toDayKey(day)].type === "bank-holiday" ? "B/HOL" : "HOL"}
                        </b>
                        {holidayByDay[toDayKey(day)].name?.[locale] ||
                          holidayByDay[toDayKey(day)].name?.en}
                      </span>
                    )}
                  </th>
                ))}
                <th className={styles.totalCol}>{t("table.total")}</th>
              </tr>
            </thead>
            <tbody>
              {loading === "loading" &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`s-${i}`}>
                    <td>
                      <span
                        className={styles.skeleton}
                        style={{ width: 160 }}
                      />
                    </td>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <span
                          className={styles.skeleton}
                          style={{ width: 64 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {loading !== "loading" && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    {staff.length ? t("noResults") : t("noStaff")}
                  </td>
                </tr>
              )}

              {loading !== "loading" &&
                rows.map(({ staff: s, id, name, days, total }) => {
                  const [bg, fg] = avatarColor(name);
                  const position =
                    s?.position?.name?.[locale] ||
                    s?.position?.name?.en ||
                    s?.userId;
                  return (
                    <tr key={id}>
                      <td className={styles.nameCol}>
                        <div className={styles.staffCell}>
                          {s?.photo ? (
                            <img
                              src={imageUrl(s.photo)}
                              alt=""
                              className={styles.avatar}
                            />
                          ) : (
                            <span
                              className={styles.avatar}
                              style={{ background: bg, color: fg }}
                            >
                              {getInitials(name)}
                            </span>
                          )}
                          <div className={styles.staffInfo}>
                            <p title={name}>{name}</p>
                            <span>
                              {position}
                              {s?.status === "inactive" && (
                                <em className={styles.inactive}>
                                  {t("inactive")}
                                </em>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {days.map((entry, i) => (
                        <td key={dayKeys[i]} className={styles.dayCol}>
                          <RosterCell
                            entry={entry}
                            request={pendingRequestByKey[entryKey(id, dayKeys[i])]}
                            canEdit={canManage && !isBusy}
                            onClick={() =>
                              setEditing({ staff: s, day: weekDays[i] })
                            }
                            label={`${name} – ${formatDayName(weekDays[i], locale)} ${formatDayDate(
                              weekDays[i],
                              locale,
                            )}`}
                            t={t}
                          />
                        </td>
                      ))}

                      <td className={styles.totalCol}>
                        <strong>{total ? formatHours(total) : "-"}</strong>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            {loading !== "loading" && staff.length > 0 && (
              <tfoot>
                <tr>
                  <td className={styles.nameCol}>{t("table.dailyTotal")}</td>
                  {dayTotals.map((d, i) => (
                    <td key={dayKeys[i]} className={styles.dayCol}>
                      <strong>
                        {d.minutes ? formatHours(d.minutes) : "-"}
                      </strong>
                      <span>{t("table.onShift", { count: d.onShift })}</span>
                    </td>
                  ))}
                  <td className={styles.totalCol}>
                    <strong>{formatHours(weekTotal)}</strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {editing && (
        <RosterCellModal
          isSelf={String(editing.staff._id) === String(user?._id)}
          show={!!editing}
          setShow={() => setEditing(null)}
          staff={editing.staff}
          staffName={staffName(editing.staff)}
          day={editing.day}
          weekDays={weekDays}
          entries={entries}
          holiday={holidayByDay[toDayKey(editing.day)]}
          request={
            pendingRequestByKey[
              entryKey(String(editing.staff._id), toDayKey(editing.day))
            ]
          }
          onReview={async (request, decision) => {
            if (await reviewRequest(request, decision)) setEditing(null);
          }}
          onApply={(keys, entry) => {
            applyCell(String(editing.staff._id), keys, entry);
            setEditing(null);
          }}
        />
      )}

      {showHistory && (
        <RosterHistoryModal
          show={showHistory}
          setShow={() => setShowHistory(false)}
          weekStart={weekKey}
          staffName={(id) => {
            const s = staff.find((x) => String(x._id) === String(id));
            return s ? staffName(s) : "";
          }}
        />
      )}

      {/* Mounted only while open: ModalSkeleton's global sizing styles would shrink the day editor */}
      {confirm && (
        <AreYouSureModal
          show={!!confirm}
          setShow={() => setConfirm(null)}
          loading={loading === "issue" || loading === "copy"}
          message={
            confirm?.type === "issue"
              ? t(isIssued ? "confirm.reissue" : "confirm.issue", {
                  count: staffOnRoster,
                  week: formatWeekLabel(weekStart, locale),
                })
              : confirm?.type === "copy"
                ? t("confirm.copy")
                : t("confirm.leave")
          }
          onConfirm={() => {
            if (confirm?.type === "issue") issueRoster();
            else if (confirm?.type === "copy") copyPreviousWeek();
            else if (confirm?.type === "leave") {
              setWeekStart(confirm.week);
              setShowPendingOnly(false);
              setConfirm(null);
            }
          }}
        />
      )}
    </Container>
  );
}

/** One day of one staff member in the roster table. */
function RosterCell({ entry, request, canEdit, onClick, label, t }) {
  let content;
  if (!entry) {
    content = canEdit ? (
      <span className={styles.addIcon}>
        <LuPlus size={16} />
      </span>
    ) : (
      <span className={styles.emptyCell}>-</span>
    );
  } else if (isWorking(entry)) {
    content = (
      <>
        {entry.type === "ro" && (
          <b className={mergeClass(styles.code, styles.code_ro_declined)}>
            {t("cell.roDeclined")}
          </b>
        )}
        <strong className={styles.shiftTime}>
          {entry.startTime} – {entry.endTime}
        </strong>
        <span className={styles.shiftHours}>
          {formatHours(entryMinutes(entry))}
          {entry.breakMinutes
            ? ` · ${t("cell.break", { minutes: entry.breakMinutes })}`
            : ""}
        </span>
      </>
    );
  } else {
    const pending = isPendingRo(entry);
    content = (
      <>
        <b className={mergeClass(styles.code, styles[`code_${entry.type}`])}>
          {ENTRY_CODES[entry.type]}
        </b>
        {entry.type === "ro" && (
          <span
            className={mergeClass(
              styles.roState,
              pending ? styles.roPending : "",
            )}
          >
            {pending
              ? t("cell.roPending")
              : entry.roDecision === "approved"
                ? t("cell.roApproved")
                : t("cell.roDeclinedNoShift")}
          </span>
        )}
      </>
    );
  }

  const className = mergeClass(
    styles.cell,
    entry ? styles[`cell_${entry.type}`] : styles.cellEmpty,
    isPendingRo(entry) || request ? styles.cellPending : "",
    canEdit ? styles.cellEditable : "",
  );

  // A staff member asked for this day off and it hasn't been reviewed yet
  const requestTag = request ? (
    <span className={styles.requestTag} title={request.reason || undefined}>
      {t("requests.cellTag")}
    </span>
  ) : null;

  const note = entry?.note ? (
    <span className={styles.noteIcon} title={entry.note}>
      <LuMessageSquare size={12} />
    </span>
  ) : null;

  if (!canEdit)
    return (
      <div className={className} title={entry?.note || undefined}>
        {requestTag}
        {content}
        {note}
      </div>
    );

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
    >
      {requestTag}
      {content}
      {note}
    </button>
  );
}
