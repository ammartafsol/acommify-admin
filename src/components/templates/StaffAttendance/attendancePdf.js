import {
  formatDayDate,
  formatDayName,
  formatDuration,
  formatTime,
  formatWeekLabel,
  getWeekDays,
  sumMinutes,
  summarizeDay,
} from "./attendanceUtils";

// The built-in PDF font only covers Latin characters, so the PDF uses the
// English name when there is one.
function pdfName(staff) {
  return staff?.fullName?.en || staff?.email || "-";
}

function cellText(day, locale, t) {
  if (day.status === "absent") return "-";
  const hours = formatDuration(day.minutes);
  const inTime = formatTime(day.firstIn, locale);
  if (day.status === "checked-in") return `${hours}\n${t("status.inSince", { time: formatTime(day.openSince, locale) })}`;
  if (day.status === "missed-checkout") return `${hours}\n${t("status.noCheckOut")}`;
  return `${hours}\n${inTime} - ${formatTime(day.lastOut, locale)}`;
}

/** Builds and downloads the weekly attendance report as a PDF. */
export async function downloadAttendancePdf({ rows, weekStart, locale, t }) {
  // Loaded on demand so the PDF library isn't part of the page bundle
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const now = new Date();
  // PDF text uses English formatting so dates/times render with the built-in font
  const pdfLocale = "en-GB";
  const days = getWeekDays(weekStart);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 42, 51);
  doc.text("Staff Attendance", 40, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(140, 147, 155);
  doc.text(formatWeekLabel(weekStart, pdfLocale), 40, 68);
  doc.text(
    `Generated ${now.toLocaleString(pdfLocale, { dateStyle: "medium", timeStyle: "short" })}`,
    doc.internal.pageSize.getWidth() - 40,
    68,
    { align: "right" },
  );

  const englishT = (key, values) => {
    // Status words in the PDF stay in English to match the built-in font
    const fallback = {
      "status.inSince": `In since ${values?.time ?? ""}`,
      "status.noCheckOut": "No check-out",
    };
    return fallback[key] ?? t(key, values);
  };

  const head = [
    [
      "Name",
      ...days.map((d) => `${formatDayName(d, pdfLocale)}\n${formatDayDate(d, pdfLocale)}`),
      "Total",
    ],
  ];

  const body = rows.map((staff) => [
    pdfName(staff),
    ...days.map((d) => cellText(summarizeDay(staff?.records, d, now), pdfLocale, englishT)),
    staff?.records?.length ? formatDuration(sumMinutes(staff.records, now)) : "-",
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 84,
    margin: { left: 40, right: 40 },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      valign: "middle",
      textColor: [23, 42, 51],
      lineColor: [230, 234, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [51, 181, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: "bold" },
      8: { fontStyle: "bold", halign: "center" },
    },
    bodyStyles: { halign: "center" },
    alternateRowStyles: { fillColor: [244, 247, 253] },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 0) {
        hook.cell.styles.halign = "left";
      }
    },
  });

  if (!rows.length) {
    doc.setFontSize(11);
    doc.setTextColor(140, 147, 155);
    doc.text("No staff found for this week.", 40, 120);
  }

  const y = weekStart;
  const fileDate = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  doc.save(`staff-attendance-${fileDate}.pdf`);
}
