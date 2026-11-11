"use client";
import Button from "@/components/atoms/Button";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import Pagination from "@/components/molecules/Pagination";
import SearchInput from "@/components/molecules/SearchInput/SearchInput";
import StaffSubNav from "@/components/molecules/StaffSubNav/StaffSubNav";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { imageUrl, mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Container } from "react-bootstrap";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { LuCalendarDays, LuDownload } from "react-icons/lu";
import {
  addDays,
  formatDayDate,
  formatDayName,
  formatDuration,
  formatTime,
  formatWeekLabel,
  getInitials,
  getSessionBar,
  getWeekDays,
  getWeekRangeParams,
  getWeekStart,
  isCurrentOrFutureWeek,
  isSameDay,
  openBreak,
  sessionMinutes,
  sumMinutes,
  summarizeDay,
  dayFlags,
  dayKeyOf,
  isCorrected,
  lunchText,
} from "./attendanceUtils";
import { downloadAttendancePdf } from "./attendancePdf";
import AttendanceEditModal from "./AttendanceEditModal";
import { entryMinutes } from "../StaffRostering/rosterUtils";
import { useSelector } from "react-redux";
import { LuPencilLine, LuTriangleAlert } from "react-icons/lu";
import styles from "./styles.module.css";

const PAGE_LIMIT = 10;
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

export default function StaffAttendance() {
  const t = useTranslations("staffAttendancePage");
  const locale = useLocale();
  const { Get } = useAxios();
  const { permissions = [], user } = useSelector((state) => state.authReducer);
  const canEdit = user?.role === "admin" || permissions.includes("edit-staff-attendance");
  const [centre, setCentre] = useState(null);
  const [editing, setEditing] = useState(null); // { staff, date, sessions, scheduled }

  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState("loading");
  const [now, setNow] = useState(() => new Date());
  const requestId = useRef(0);

  const filterOptions = [
    { label: t("filters.all"), value: "all" },
    { label: t("filters.checkedIn"), value: "checked-in" },
    { label: t("filters.absent"), value: "absent" },
  ];
  const [filter, setFilter] = useState(filterOptions[0]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const isCurrentWeek = isCurrentOrFutureWeek(weekStart);

  // Keep "checked in" durations live
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function buildParams(extra = {}) {
    return new URLSearchParams({
      ...getWeekRangeParams(weekStart),
      search: debouncedSearch?.trim() || "",
      filter: filter?.value || "all",
      // the week's issued roster is used for planned vs actual
      weekStart: dayKeyOf(weekStart),
      ...extra,
    }).toString();
  }

  async function getData(_page = page) {
    const current = ++requestId.current;
    setLoading("loading");
    const { response } = await Get({
      route: `staff-attendance/all?${buildParams({ page: _page, limit: PAGE_LIMIT })}`,
    });
    // Ignore responses from older requests (fast week switching)
    if (current !== requestId.current) return;
    if (response) {
      setData(Array.isArray(response?.data) ? response.data : []);
      setTotalRecords(response?.totalRecords || 0);
      setCentre(response?.centre || null);
    }
    setNow(new Date());
    setLoading("");
  }

  useEffect(() => {
    setPage(1);
    getData(1);
  }, [weekStart, debouncedSearch, filter?.value]);

  async function handleDownload() {
    setLoading("pdf");
    const { response } = await Get({
      route: `staff-attendance/all?${buildParams()}`,
    });
    if (response) {
      try {
        await downloadAttendancePdf({
          rows: Array.isArray(response?.data) ? response.data : [],
          weekStart,
          centreName: response?.centre?.name?.en || response?.centre?.name?.[locale] || "",
          generatedBy: user?.fullName?.en || user?.fullName?.[locale] || user?.email || "",
        });
      } catch (error) {
        console.error(error);
        RenderToast({ type: "error", message: t("pdfError") });
      }
    }
    setLoading("");
  }

  const rows = data.map((staff) => {
    const name =
      staff?.fullName?.[locale] || staff?.fullName?.en || staff?.email || "-";
    const scheduledByDay = Object.fromEntries((staff?.scheduled || []).map((e) => [e.date, e]));
    const days = weekDays.map((day) => {
      const summary = summarizeDay(staff?.records, day, now);
      const scheduled = scheduledByDay[dayKeyOf(day)] || null;
      return {
        ...summary,
        scheduled,
        plannedMinutes: entryMinutes(scheduled),
        flags: dayFlags(summary, scheduled, day, now),
        corrected: isCorrected(summary.sessions),
      };
    });
    return {
      staff,
      name,
      days,
      total: sumMinutes(staff?.records, now),
      planned: days.reduce((sum, d) => sum + d.plannedMinutes, 0),
      isCheckedIn: Boolean(staff?.current),
    };
  });

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      <StaffSubNav />

      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.weekSelector}>
            <button
              type="button"
              className={styles.weekBtn}
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              aria-label={t("previousWeek")}
            >
              <IoChevronBack size={16} className={styles.flipRtl} />
            </button>
            <button
              type="button"
              className={styles.weekLabel}
              onClick={() => setWeekStart(getWeekStart())}
              title={t("goToCurrentWeek")}
            >
              <LuCalendarDays size={16} />
              <span>{formatWeekLabel(weekStart, locale)}</span>
            </button>
            <button
              type="button"
              className={styles.weekBtn}
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              disabled={isCurrentWeek}
              aria-label={t("nextWeek")}
            >
              <IoChevronForward size={16} className={styles.flipRtl} />
            </button>
          </div>

          <Button
            label={loading === "pdf" ? t("downloading") : t("downloadPdf")}
            variant="primary"
            leftIcon={<LuDownload size={18} />}
            onClick={handleDownload}
            disabled={loading === "pdf" || (loading === "" && !totalRecords)}
            className={styles.downloadBtn}
          />
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <i className={styles.dotIn} /> {t("status.checkedIn")}
          </span>
          <span className={styles.legendItem}>
            <i className={styles.dotOut} /> {t("status.checkedOut")}
          </span>
          <span className={styles.legendItem}>
            <i className={styles.dotMissed} /> {t("status.missedCheckOut")}
          </span>
          <span className={styles.legendItem}>
            <b className={styles.flagPill}>!</b> {t("flags.legend")}
          </span>
          <span className={styles.legendItem}>
            <b className={styles.correctedPill}>
              <LuPencilLine size={11} />
            </b>{" "}
            {t("flags.corrected")}
          </span>
        </div>

        <div className={styles.filters}>
          <div className={styles.search}>
            <SearchInput
              placeholder={t("searchPlaceholder")}
              value={search}
              setValue={setSearch}
            />
          </div>
          <div className={styles.filterDropdown}>
            <DropDown
              options={filterOptions}
              value={filter}
              setValue={(val) => setFilter(val || filterOptions[0])}
              isSearchable={false}
              isPortal
            />
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.nameCol}>{t("table.name")}</th>
                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={mergeClass(
                      styles.dayCol,
                      isSameDay(day, now) ? styles.today : "",
                    )}
                  >
                    <span className={styles.dayName}>
                      {formatDayName(day, locale)}
                    </span>
                    <span className={styles.dayDate}>
                      {formatDayDate(day, locale)}
                    </span>
                  </th>
                ))}
                <th className={styles.totalCol}>{t("table.total")}</th>
              </tr>
            </thead>
            <tbody>
              {loading === "loading" &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`s-${i}`} className={styles.skeletonRow}>
                    <td>
                      <span className={styles.skeleton} style={{ width: 160 }} />
                    </td>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <span className={styles.skeleton} style={{ width: 56 }} />
                      </td>
                    ))}
                  </tr>
                ))}

              {loading !== "loading" && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    {t("empty")}
                  </td>
                </tr>
              )}

              {loading !== "loading" &&
                rows.map(({ staff, name, days, total, planned, isCheckedIn }) => {
                  const [bg, fg] = avatarColor(name);
                  return (
                    <tr key={staff?._id || staff?.slug}>
                      <td className={styles.nameCol}>
                        <div className={styles.staffCell}>
                          {staff?.photo ? (
                            <img
                              src={imageUrl(staff.photo)}
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
                            <p title={name}>
                              {name}
                              {String(staff?._id) === String(user?._id) && (
                                <em className={styles.youTag} title={t("edit.ownRecord")}>
                                  {t("edit.you")}
                                </em>
                              )}
                            </p>
                            {isCheckedIn && openBreak(staff.current) ? (
                              <span className={mergeClass(styles.livePill, styles.breakPill)}>
                                <i className={styles.dotMissed} />
                                {t("status.onBreakSince", {
                                  time: formatTime(openBreak(staff.current).start, locale),
                                })}
                              </span>
                            ) : isCheckedIn ? (
                              <span className={styles.livePill}>
                                <i className={styles.dotIn} />
                                {t("status.onShiftSince", {
                                  time: formatTime(staff.current.checkIn, locale),
                                })}
                              </span>
                            ) : (
                              staff?.userId && <span>{staff.userId}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {days.map((day, i) => (
                        <td key={i} className={styles.dayCol}>
                          <DayCell
                            day={day}
                            date={weekDays[i]}
                            locale={locale}
                            t={t}
                            // Nobody may change their own recorded attendance
                            canEdit={canEdit && String(staff?._id) !== String(user?._id)}
                            onEdit={() =>
                              setEditing({
                                staff,
                                name,
                                date: weekDays[i],
                                sessions: day.sessions,
                                scheduled: day.scheduled,
                              })
                            }
                          />
                        </td>
                      ))}

                      <td className={styles.totalCol}>
                        <strong>{total ? formatDuration(total) : "-"}</strong>
                        {planned > 0 && (
                          <span
                            className={mergeClass(
                              styles.plannedTotal,
                              total < planned ? styles.under : styles.over,
                            )}
                          >
                            {t("planned.of", { hours: formatDuration(planned) })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <AttendanceEditModal
          show={!!editing}
          setShow={() => setEditing(null)}
          staffName={editing.name}
          staffId={editing.staff._id}
          date={editing.date}
          sessions={editing.sessions}
          scheduled={editing.scheduled}
          onSaved={() => getData(page)}
        />
      )}

      {totalRecords > PAGE_LIMIT && (
        <Pagination
          currentPage={page}
          totalRecords={totalRecords}
          limit={PAGE_LIMIT}
          setCurrentPage={(p) => {
            setPage(p);
            getData(p);
          }}
        />
      )}
    </Container>
  );
}

function DayCell({ day, date, locale, t, canEdit, onEdit }) {
  const cellRef = useRef(null);
  const [anchor, setAnchor] = useState(null);

  // Close the popover when the page scrolls or resizes (its position would be stale)
  useEffect(() => {
    if (!anchor) return undefined;
    const close = () => setAnchor(null);
    // Only scrolling that moves this cell (page or table scroll) should close it
    const onScroll = (e) => {
      const target = e.target;
      if (target === document || target?.contains?.(cellRef.current)) close();
    };
    const onDown = (e) => {
      if (!cellRef.current?.contains(e.target)) setAnchor(null);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [anchor]);

  const extras = (
    <>
      {day.plannedMinutes > 0 && (
        <span className={styles.planned}>
          {t("planned.label", { hours: formatDuration(day.plannedMinutes) })}
        </span>
      )}
      {day.flags.map((f) => (
        <span key={f} className={styles.flag}>
          <LuTriangleAlert size={11} />
          {t(`flags.${f}`)}
        </span>
      ))}
    </>
  );
  const editButton = canEdit ? (
    <button
      type="button"
      className={styles.editBtn}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      aria-label={t("edit.title")}
      title={t("edit.title")}
    >
      <LuPencilLine size={13} />
    </button>
  ) : null;

  if (day.status === "absent") {
    return (
      <div className={styles.absentCell}>
        <span className={styles.absent}>-</span>
        {extras}
        {editButton}
      </div>
    );
  }

  const inTime = formatTime(day.firstIn, locale);
  const outTime = day.lastOut ? formatTime(day.lastOut, locale) : "";
  const sessionCount = day.sessions.length;

  const open = () => setAnchor(cellRef.current?.getBoundingClientRect() || null);

  return (
    <div
      ref={cellRef}
      className={mergeClass(styles.dayCell, styles.hasPopover, styles[day.status])}
      // Mouse: show on hover. Touch/pen: toggle on tap.
      onPointerEnter={(e) => e.pointerType === "mouse" && open()}
      onPointerMove={(e) => e.pointerType === "mouse" && !anchor && open()}
      onPointerLeave={(e) => e.pointerType === "mouse" && setAnchor(null)}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") anchor ? setAnchor(null) : open();
      }}
      onFocus={open}
      onBlur={() => setAnchor(null)}
      tabIndex={0}
      aria-label={t("history.title", { count: sessionCount })}
    >
      <strong>
        {formatDuration(day.minutes)}
        {day.corrected && (
          <b className={styles.correctedPill} title={t("flags.corrected")}>
            <LuPencilLine size={10} />
          </b>
        )}
      </strong>
      {day.status === "checked-in" && day.onBreakSince && (
        <span className={mergeClass(styles.cellStatus, styles.cellBreak)}>
          <i className={styles.dotMissed} />
          {t("status.onBreak")}
        </span>
      )}
      {day.status === "checked-in" && !day.onBreakSince && (
        <span className={styles.cellStatus}>
          <i className={styles.dotIn} />
          {t("status.inSince", { time: formatTime(day.openSince, locale) })}
        </span>
      )}
      {day.status === "checked-out" && (
        <span className={styles.cellTimes}>
          {inTime} – {outTime}
        </span>
      )}
      {/* A missing clock-out shows as a flag below (with the other missing-record flags) */}
      {day.breakMinutes > 0 && (
        <span className={styles.sessions}>
          {t("status.lunchTimes", {
            times: lunchText(day.sessions, locale),
            hours: formatDuration(day.breakMinutes),
          })}
        </span>
      )}
      {extras}
      {editButton}
      {sessionCount > 1 && (
        <span className={styles.sessions}>
          {t("status.sessions", { count: sessionCount })}
        </span>
      )}

      {anchor && (
        <SessionPopover
          anchor={anchor}
          day={day}
          date={date}
          locale={locale}
          t={t}
        />
      )}
    </div>
  );
}

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 8;

/** Check-in / check-out history for one staff member on one day. */
function SessionPopover({ anchor, day, date, locale, t }) {
  const popRef = useRef(null);
  const [pos, setPos] = useState(null);

  // Place below the cell, or above it when there isn't room; keep it on screen
  useLayoutEffect(() => {
    const height = popRef.current?.offsetHeight || 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(
      Math.max(8, anchor.left + anchor.width / 2 - POPOVER_WIDTH / 2),
      vw - POPOVER_WIDTH - 8,
    );
    const below = anchor.bottom + POPOVER_GAP;
    const top =
      below + height > vh - 8 && anchor.top - POPOVER_GAP - height > 8
        ? anchor.top - POPOVER_GAP - height
        : below;
    setPos({ top, left });
  }, [anchor]);

  const now = new Date();
  const bar = getSessionBar(day.sessions, now);

  return createPortal(
    <div
      ref={popRef}
      className={styles.popover}
      style={{
        width: POPOVER_WIDTH,
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? "visible" : "hidden",
      }}
      role="tooltip"
    >
      <div className={styles.popoverHeader}>
        <div className={styles.popoverDate}>
          <span>{date?.toLocaleDateString(locale, { weekday: "long" })}</span>
          <strong>
            {date?.toLocaleDateString(locale, { day: "numeric", month: "short" })}
          </strong>
        </div>
        <div className={styles.popoverTotal}>
          <span>{t("history.title", { count: day.sessions.length })}</span>
          <strong>{formatDuration(day.minutes)}</strong>
        </div>
      </div>

      {/* Where in the day each session falls */}
      <div className={styles.dayBar}>
        <div className={styles.dayTrack}>
          {bar.segments.map((seg) => (
            <span
              key={`bar-${seg.key}`}
              className={mergeClass(
                styles.daySegment,
                seg.kind === "live" ? styles.segLive : "",
                seg.kind === "missed" ? styles.segMissed : "",
              )}
              style={{ insetInlineStart: `${seg.left}%`, width: `${seg.width}%` }}
            />
          ))}
        </div>
        <div className={styles.dayScale}>
          <span>{formatTime(bar.from, locale)}</span>
          <span>{formatTime(bar.to, locale)}</span>
        </div>
      </div>

      {day.sessions.some((s) => s.corrections?.length) && (
        <div className={styles.auditBox}>
          {day.sessions.flatMap((s) =>
            (s.corrections || []).map((c, i) => (
              <p key={`${s._id}-${i}`}>
                <LuPencilLine size={12} />
                <span>
                  {t("history.correctedBy", {
                    name: c.correctedBy?.fullName?.[locale] || c.correctedBy?.fullName?.en || "-",
                    date: new Date(c.correctedAt).toLocaleString(locale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })}
                  {" · "}“{c.reason}”
                </span>
              </p>
            )),
          )}
        </div>
      )}
      <ol className={styles.sessionList}>
        {day.sessions.map((s) => {
          const isOpen = !s.checkOut && !s.missedCheckOut;
          const isMissed = !s.checkOut && s.missedCheckOut;
          return (
            <li
              key={s._id || s.checkIn}
              className={mergeClass(
                isOpen ? styles.sessionOpen : "",
                isMissed ? styles.sessionMissedRow : "",
              )}
            >
              <span className={styles.sessionDot} />
              <div className={styles.sessionRange}>
                <span>{formatTime(s.checkIn, locale)}</span>
                <span className={styles.arrow} aria-hidden>
                  →
                </span>
                {isOpen ? (
                  <span className={styles.liveBadge}>
                    <i />
                    {t("history.inProgress")}
                  </span>
                ) : isMissed ? (
                  <span className={styles.missedBadge}>{t("status.noCheckOut")}</span>
                ) : (
                  <span>{formatTime(s.checkOut, locale)}</span>
                )}
              </div>
              <span className={styles.sessionDuration}>
                {isMissed ? "–" : formatDuration(sessionMinutes(s, now))}
              </span>
              {s.breaks?.length > 0 && (
                <ul className={styles.breakList}>
                  {s.breaks.map((b) => (
                    <li key={b.start}>
                      <span>{t("history.break")}</span>
                      <span>
                        {formatTime(b.start, locale)} →{" "}
                        {b.end ? formatTime(b.end, locale) : t("history.inProgress")}
                      </span>
                      <span>
                        {formatDuration(
                          ((b.end ? new Date(b.end) : now) - new Date(b.start)) / 60000,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>,
    document.body,
  );
}
