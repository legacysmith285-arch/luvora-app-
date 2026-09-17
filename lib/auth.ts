import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Hashes a password with scrypt and a per-user random salt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

/** Compares a password against a stored `scrypt$salt$hash` string in constant time. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, "base64");
  const derived = await scryptAsync(
    password.normalize("NFKC"),
    Buffer.from(saltB64, "base64"),
    expected.length,
  );
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export const GENDERS = [
  "woman",
  "man",
  "non-binary",
  "other",
  "prefer-not-to-say",
] as const;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Full years between a `YYYY-MM-DD` birth date and today (UTC). */
export function ageInYears(dateOfBirth: string, today = new Date()): number {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = today.getUTCFullYear() - year;
  const monthDiff = today.getUTCMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < day)) age -= 1;
  return age;
}

export interface RegistrationValues {
  fullName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  country: string;
  gender: string;
}

export interface ValidationResult {
  errors: Record<string, string>;
  values: RegistrationValues;
}

/**
 * Validates and normalises a registration payload. Usernames and emails are
 * lower-cased so they stay unique regardless of how they were typed.
 */
export function validateRegistration(input: Record<string, unknown>): ValidationResult {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  const values: RegistrationValues = {
    fullName: text(input.fullName),
    username: text(input.username).toLowerCase(),
    email: text(input.email).toLowerCase(),
    password: typeof input.password === "string" ? input.password : "",
    dateOfBirth: text(input.dateOfBirth),
    country: text(input.country),
    gender: text(input.gender).toLowerCase(),
  };

  const errors: Record<string, string> = {};

  if (values.fullName.length < 2 || values.fullName.length > 80) {
    errors.fullName = "Please enter your full name (2–80 characters).";
  }
  if (!USERNAME_PATTERN.test(values.username)) {
    errors.username = "Usernames are 3–20 characters: letters, numbers and underscores.";
  }
  if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254) {
    errors.email = "Please enter a valid email address.";
  }
  if (values.password.length < 8 || values.password.length > 200) {
    errors.password = "Passwords must be at least 8 characters.";
  }

  if (!ISO_DATE_PATTERN.test(values.dateOfBirth) || Number.isNaN(Date.parse(values.dateOfBirth))) {
    errors.dateOfBirth = "Please enter your date of birth.";
  } else {
    const age = ageInYears(values.dateOfBirth);
    if (age < 18) errors.dateOfBirth = "You must be 18 or older to join Luvora.";
    else if (age > 120) errors.dateOfBirth = "Please enter a valid date of birth.";
  }

  if (!values.country || values.country.length > 60) {
    errors.country = "Please select your country.";
  }
  if (!GENDERS.includes(values.gender as (typeof GENDERS)[number])) {
    errors.gender = "Please select a gender.";
  }
  if (input.over18 !== true) {
    errors.over18 = "Please confirm that you are 18 or older.";
  }

  return { errors, values };
}
