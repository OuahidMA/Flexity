/**
 * CSV export helpers for dashboard tables.
 * Serializes rows in memory and triggers a browser download, so no server
 * round-trip is required and the current filtered dataset is exported.
 */

/**
 * Quote a value and escape embedded quotes so Excel-compatible CSV parsers
 * keep commas and newlines inside a single cell.
 *
 * @param {unknown} value - Cell value; null/undefined become an empty string.
 * @returns {string} A quoted, escaped CSV cell.
 */
function escapeCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

/**
 * Build and download a CSV file from table rows.
 *
 * @param {string} filename - Download name, including the `.csv` extension.
 * @param {Array<object>} rows - Source records.
 * @param {Array<{ header: string, value: (row: object) => unknown }>} columns -
 *   Header label plus an accessor that maps a row to its cell value.
 */
export function exportToCsv(filename, rows, columns) {
  const header = columns.map((column) => escapeCell(column.header)).join(",")
  const body = rows
    .map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(",")
    )
    .join("\n")

  const blob = new Blob([`${header}\n${body}`], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
