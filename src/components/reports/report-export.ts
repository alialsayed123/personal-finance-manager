import type { AppLanguage, TransactionCurrencyTotal, TransactionWithCategory } from "@/types/finance";
import { formatCurrency, formatDate, safeFileName } from "@/lib/utils";

export interface ReportExportLabels {
  title: string;
  date: string;
  category: string;
  currency: string;
  amount: string;
  type: string;
  notes: string;
  income: string;
  expense: string;
  totalIncome: string;
  totalExpenses: string;
  net: string;
  transactionsSheet: string;
  summarySheet: string;
}

function reportRows(items: TransactionWithCategory[], language: AppLanguage, labels: ReportExportLabels) {
  return items.map((item) => ({
    [labels.date]: formatDate(item.occurredAt, language),
    [labels.category]: language === "ar" ? item.categoryNameAr : item.categoryNameEn,
    [labels.currency]: item.currency,
    [labels.amount]: item.amount,
    [labels.type]: item.type === "income" ? labels.income : labels.expense,
    [labels.notes]: item.notes ?? "",
  }));
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeSpreadsheetCell(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportReportCsv(
  items: TransactionWithCategory[],
  language: AppLanguage,
  labels: ReportExportLabels,
): void {
  const rows = reportRows(items, language, labels) as Array<Record<string, unknown>>;
  const headers = Object.keys(rows[0] ?? {
    [labels.date]: "",
    [labels.category]: "",
    [labels.currency]: "",
    [labels.amount]: "",
    [labels.type]: "",
    [labels.notes]: "",
  });
  const escape = (value: unknown) =>
    `"${String(sanitizeSpreadsheetCell(value) ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
  downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `${safeFileName(labels.title)}.csv`);
}

export async function exportReportExcel(
  items: TransactionWithCategory[],
  totals: TransactionCurrencyTotal[],
  language: AppLanguage,
  labels: ReportExportLabels,
): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const transactionsSheet = XLSX.utils.json_to_sheet(
    reportRows(items, language, labels).map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, sanitizeSpreadsheetCell(value)]),
      ),
    ),
  );
  const totalsSheet = XLSX.utils.json_to_sheet(
    totals.map((item) => ({
      [labels.currency]: item.currency,
      [labels.totalIncome]: item.totalIncome,
      [labels.totalExpenses]: item.totalExpenses,
      [labels.net]: item.net,
    })),
  );
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, labels.transactionsSheet.slice(0, 31));
  XLSX.utils.book_append_sheet(workbook, totalsSheet, labels.summarySheet.slice(0, 31));
  XLSX.writeFile(workbook, `${safeFileName(labels.title)}.xlsx`, { compression: true });
}

export async function exportReportPdf(
  items: TransactionWithCategory[],
  totals: TransactionCurrencyTotal[],
  language: AppLanguage,
  labels: ReportExportLabels,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const container = document.createElement("div");
  container.dir = language === "ar" ? "rtl" : "ltr";
  container.style.cssText = [
    "position:fixed",
    "left:-100000px",
    "top:0",
    "width:1120px",
    "padding:40px",
    "background:#ffffff",
    "color:#111827",
    "font-family:Arial,sans-serif",
  ].join(";");
  document.body.appendChild(container);

  const summaryHtml = totals
    .map(
      (total) => `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;min-width:260px">
          <strong>${escapeHtml(total.currency)}</strong><br />
          ${escapeHtml(labels.totalIncome)}: ${escapeHtml(formatCurrency(total.totalIncome, total.currency, language))}<br />
          ${escapeHtml(labels.totalExpenses)}: ${escapeHtml(formatCurrency(total.totalExpenses, total.currency, language))}<br />
          ${escapeHtml(labels.net)}: ${escapeHtml(formatCurrency(total.net, total.currency, language))}
        </div>`,
    )
    .join("");

  const pageSize = 25;
  const pages: TransactionWithCategory[][] = items.length
    ? Array.from({ length: Math.ceil(items.length / pageSize) }, (_, index) =>
        items.slice(index * pageSize, (index + 1) * pageSize),
      )
    : [[]];

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const availableWidth = pageWidth - 10;
  const availableHeight = pageHeight - 10;

  try {
    if (document.fonts) await document.fonts.ready;

    for (const [pageIndex, pageItems] of pages.entries()) {
      const rowsHtml = pageItems
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDate(item.occurredAt, language))}</td>
              <td>${escapeHtml(language === "ar" ? item.categoryNameAr : item.categoryNameEn)}</td>
              <td>${escapeHtml(item.currency)}</td>
              <td>${escapeHtml(formatCurrency(item.amount, item.currency, language))}</td>
              <td>${escapeHtml(item.type === "income" ? labels.income : labels.expense)}</td>
              <td>${escapeHtml(item.notes ?? "")}</td>
            </tr>`,
        )
        .join("");

      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:18px">
          <h1 style="font-size:26px;margin:0">${escapeHtml(labels.title)}</h1>
          <span style="font-size:12px;color:#6b7280">${pageIndex + 1} / ${pages.length}</span>
        </div>
        ${pageIndex === 0 ? `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">${summaryHtml}</div>` : ""}
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f3f4f6">
              <th>${escapeHtml(labels.date)}</th>
              <th>${escapeHtml(labels.category)}</th>
              <th>${escapeHtml(labels.currency)}</th>
              <th>${escapeHtml(labels.amount)}</th>
              <th>${escapeHtml(labels.type)}</th>
              <th>${escapeHtml(labels.notes)}</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <style>
          th,td {
            border:1px solid #e5e7eb;
            padding:8px;
            text-align:${language === "ar" ? "right" : "left"};
            vertical-align:top;
            overflow-wrap:anywhere;
          }
        </style>
      `;

      const canvas = await html2canvas(container, {
        scale: 1.35,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const image = canvas.toDataURL("image/jpeg", 0.92);
      const scale = Math.min(
        availableWidth / canvas.width,
        availableHeight / canvas.height,
      );
      const imageWidth = canvas.width * scale;
      const imageHeight = canvas.height * scale;
      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(image, "JPEG", x, y, imageWidth, imageHeight, undefined, "FAST");
    }

    pdf.save(`${safeFileName(labels.title)}.pdf`);
  } finally {
    container.remove();
  }
}
