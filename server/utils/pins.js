/**
 * One-time setup PIN helpers.
 *
 * Gym admins generate a PIN for a new coach/client. The member signs in with the
 * PIN, then chooses an email/password; setup clears the PIN. PINs are stored
 * uppercase and without separators, but display as XXXX-XXXX to make them easier
 * to read aloud or type.
 *
 * The alphabet omits visually ambiguous characters (0/O, 1/I) and uses
 * crypto.randomInt so PINs are not predictable.
 */

import { randomInt } from "node:crypto";
import User from "../models/User.js";

const PIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PIN_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Canonicalizes user-entered PINs: uppercase and alphanumeric only.
 *
 * @param {unknown} value Raw PIN, with or without dashes/spaces.
 * @returns {string}
 */
export function normalizePin(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * @param {unknown} value Raw PIN.
 * @returns {boolean} True when the value is a well-formed PIN.
 */
export function isValidPin(value) {
  const pin = normalizePin(value);

  return (
    pin.length === PIN_LENGTH &&
    [...pin].every((character) => PIN_ALPHABET.includes(character))
  );
}

/**
 * Formats a compact PIN for display, for example "ABCD2345" -> "ABCD-2345".
 *
 * @param {unknown} value Raw/compact PIN.
 * @returns {string}
 */
export function formatPin(value) {
  const pin = normalizePin(value);

  return pin.length === PIN_LENGTH
    ? `${pin.slice(0, 4)}-${pin.slice(4)}`
    : pin;
}

/**
 * Checks whether a PIN is still attached to any pending coach/client.
 *
 * @param {string} pin Normalized PIN.
 * @returns {Promise<boolean>}
 */
export async function pinInUse(pin) {
  const existing = await User.exists({
    $or: [{ "coaches.claimPin": pin }, { "clients.claimPin": pin }],
  });

  return Boolean(existing);
}

/**
 * Generates a unique PIN that is not currently attached to any member.
 *
 * @returns {Promise<string>} Compact 8-character PIN.
 */
export async function generateAccessPin() {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    let pin = "";

    for (let index = 0; index < PIN_LENGTH; index += 1) {
      pin += PIN_ALPHABET[randomInt(0, PIN_ALPHABET.length)];
    }

    if (!(await pinInUse(pin))) return pin;
  }

  const error = new Error("Unable to generate a unique PIN. Please try again.");
  error.status = 503;
  throw error;
}
