const BRAND = [234, 88, 12];
const INK = [16, 17, 20];
const MUTED = [110, 113, 125];
const HAIRLINE = [222, 222, 229];

const PAGE = { width: 210, height: 297 };
const MARGIN = 16;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const BOTTOM_LIMIT = PAGE.height - 20;
const ROW_HEIGHT = 7.5;

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "workout";

const dash = (value) =>
  value === undefined || value === null || value === "" ? "-" : String(value);

/**
 * Callers pass one of three exercise shapes, so flatten them into a single
 * printable line: a planned routine line ({ sets, reps }) or a tracked session
 * line ({ sets: [{ weight, reps, done }] }).
 */
const toLines = (routine) => {
  const source = Array.isArray(routine?.lines)
    ? routine.lines
    : Array.isArray(routine?.exercises)
      ? routine.exercises
      : [];

  return source.map((line, index) => {
    const name =
      line?.name ||
      line?.exerciseName ||
      line?.exercise?.name ||
      `Exercise ${index + 1}`;

    const tracked = Array.isArray(line?.sets_) ? line.sets_ : line?.sets;
    if (Array.isArray(tracked)) {
      const sets = tracked;
      const volume = sets.reduce(
        (total, set) => total + num(set?.weight) * num(set?.reps),
        0
      );
      return {
        name,
        detail: sets
          .map(
            (set, setIndex) =>
              `#${setIndex + 1}  ${dash(set?.weight)} lbs x ${num(set?.reps)}`
          )
          .join("     "),
        planned: `${sets.length} sets`,
        volume,
        done: sets.filter((set) => set?.done).length,
        total: sets.length,
      };
    }

    const sets = Math.max(1, Math.round(num(line?.sets, 1)));
    const reps = num(line?.reps);
    return {
      name,
      detail: reps > 0 ? `${sets} sets x ${reps} reps` : `${sets} set${sets === 1 ? "" : "s"}`,
      planned: `${sets} sets`,
      volume: sets * reps,
      done: null,
      total: sets,
    };
  });
};

const drawFooter = (doc, pageCount) => {
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    doc.text("Flexboard", MARGIN, PAGE.height - 12);
    doc.text(
      `Page ${page} of ${pageCount}`,
      PAGE.width - MARGIN,
      PAGE.height - 12,
      { align: "right" }
    );
  }
};

export async function exportWorkoutPdf(routine) {
  const { jsPDF } = await import("jspdf");
  const title = String(routine?.title || routine?.name || "Workout").trim() || "Workout";
  const lines = toLines(routine);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE.width, 4, "F");

  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(...INK);
  let y = 24;
  for (const line of doc.splitTextToSize(title, CONTENT_WIDTH)) {
    doc.text(line, MARGIN, y);
    y += 9;
  }

  const subtitle = [routine?.group, formatDate(new Date())].filter(Boolean).join("  ·  ");
  if (subtitle) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
    doc.text(subtitle, MARGIN, y);
    y += 7;
  }

  if (routine?.description) {
    doc.setFontSize(9.5).setTextColor(...MUTED);
    for (const line of doc.splitTextToSize(String(routine.description), CONTENT_WIDTH)) {
      if (y > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN + 6;
      }
      doc.text(line, MARGIN, y);
      y += 5;
    }
  }

  const completedVolume = lines.reduce((total, line) => total + line.volume, 0);
  const stats = [
    ["Exercises", String(lines.length)],
    ["Total sets", String(lines.reduce((total, line) => total + line.total, 0))],
    ["Planned volume", `${Math.round(completedVolume).toLocaleString("en-US")} lbs`],
  ];
  if (routine?.duration) stats.push(["Duration", String(routine.duration)]);

  y += 4;
  const statHeight = 18;
  doc.setFillColor(250, 250, 251).setDrawColor(...HAIRLINE);
  doc.rect(MARGIN, y, CONTENT_WIDTH, statHeight, "FD");
  stats.forEach(([label, value], index) => {
    const columnWidth = CONTENT_WIDTH / stats.length;
    const x = MARGIN + columnWidth * index + 5;
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, y + 6.5);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
    doc.text(value, x, y + 13);
  });
  y += statHeight + 10;

  if (lines.length === 0) {
    doc.setFont("helvetica", "italic").setFontSize(11).setTextColor(...MUTED);
    doc.text("No exercises recorded for this workout.", MARGIN, y);
    drawFooter(doc, doc.getNumberOfPages());
    return savePdf(doc, title);
  }

  const columns = [
    { key: "index", label: "#", width: 10, align: "left" },
    { key: "name", label: "Exercise", width: 78, align: "left" },
    { key: "planned", label: "Sets", width: 22, align: "right" },
    { key: "volume", label: "Volume", width: 24, align: "right" },
  ];

  const drawHeaderRow = () => {
    doc.setFillColor(...HAIRLINE).rect(MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT, "F");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...INK);
    columns.forEach((column) => {
      const x =
        column.align === "right"
          ? MARGIN + column.offset + column.width
          : MARGIN + column.offset;
      doc.text(column.label.toUpperCase(), x, y + 5, { align: column.align });
    });
    y += ROW_HEIGHT;
  };

  columns[0].offset = 4;
  columns[1].offset = columns[0].width;
  columns[2].offset = columns[1].offset + columns[1].width;
  columns[3].offset = columns[2].offset + columns[2].width;

  drawHeaderRow();

  lines.forEach((line, index) => {
    const wrapped = doc.splitTextToSize(line.name, columns[1].width - 4);
    const rowHeight = Math.max(ROW_HEIGHT, wrapped.length * 4.6 + 3.2);

    if (y + rowHeight > BOTTOM_LIMIT) {
      doc.addPage();
      y = MARGIN + 4;
      drawHeaderRow();
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 250).rect(MARGIN, y, CONTENT_WIDTH, rowHeight, "F");
    }

    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
    doc.text(String(index + 1), MARGIN + columns[0].offset, y + 5);

    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
    doc.text(wrapped, MARGIN + columns[1].offset, y + 5, { baseline: "top" });

    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
    doc.text(line.planned, MARGIN + columns[2].offset + columns[2].width, y + 5, {
      align: "right",
    });
    doc.text(
      `${Math.round(line.volume).toLocaleString("en-US")} lbs`,
      MARGIN + columns[3].offset + columns[3].width,
      y + 5,
      { align: "right" }
    );

    doc.setFontSize(8).setTextColor(...MUTED);
    doc.text(line.detail, MARGIN + columns[1].offset, y + rowHeight - 1.5);

    doc.setDrawColor(...HAIRLINE).setLineWidth(0.2);
    doc.line(MARGIN, y + rowHeight, MARGIN + CONTENT_WIDTH, y + rowHeight);

    y += rowHeight;
  });

  drawFooter(doc, doc.getNumberOfPages());
  return savePdf(doc, title);
}

function savePdf(doc, title) {
  const filename = `${slugify(title)}.pdf`;
  const blob = doc.output("blob");
  const size = `${Math.max(1, Math.round(blob.size / 1024))} KB`;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    ok: true,
    filename,
    size,
    blob,
    generatedAt: new Date().toISOString(),
  };
}