/**
 * Formats a compact setup PIN for display, for example "ABCD2345" -> "ABCD-2345".
 *
 * @param {unknown} value Raw/compact PIN.
 * @returns {string}
 */
export function formatPin(value) {
  const pin = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")

  if (pin.length <= 4) return pin

  return `${pin.slice(0, 4)}-${pin.slice(4)}`
}
