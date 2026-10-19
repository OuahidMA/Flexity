/**
 * Routine code generation.
 *
 * Codes are 10 characters from an ambiguity-free alphabet (no I/O/0/1) so they
 * can be read aloud or typed. crypto.randomInt is used instead of Math.random
 * for unpredictability; collisions are checked against the unique index with a
 * bounded retry loop.
 */

import crypto from "node:crypto";
import Routine from "../models/Routine.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;
const MAX_ATTEMPTS = 10;

/**
 * Generates one random candidate code (not yet checked for collisions).
 *
 * @returns {string}
 */
function randomCode() {
  let code = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }

  return code;
}

/**
 * Generates a unique routine code, retrying on collision up to MAX_ATTEMPTS.
 *
 * @returns {Promise<string>} Uppercase code safe to show to clients.
 * @throws {Error} 500 when no unique code could be found.
 */
export async function generateRoutineCode() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = randomCode();
    const exists = await Routine.exists({ routineCode: code });

    if (!exists) return code;
  }

  const error = new Error("Unable to generate a unique routine id.");
  error.status = 500;
  throw error;
}
