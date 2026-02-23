/* =========================================
   PROP (FIELD-SPECIFIC) PLUGINS

   These middleware are meant to run ONLY for
   specific fields via:

     chainit(obj, {
       props: {
         email: [required(), normalizeEmail()],
         age: [min(18)]
       }
     })

   Same middleware contract:

     (key, value, ctx) => newValue | SKIP | undefined | throw

   return value → replace
   return undefined → keep original
   return SKIP → omit field
   throw → validation error
========================================= */

import { SKIP } from "../core/index.js";

/* =========================================
   REQUIRED / PRESENCE
========================================= */

/* -----------------------------------------
   required()

   Fails if:
   - null
   - undefined
   - empty string

   Common for forms / DTO validation
----------------------------------------- */
export const required = (message) => (key, value) => {
  if (value == null || value === "")
    throw Error(message || `${key} is required`);
};

/* -----------------------------------------
   defined()

   Only checks undefined
   (allows "" or null)
----------------------------------------- */
export const defined = (message) => (key, value) => {
  if (value === undefined) throw Error(message || `${key} must be defined`);
};

/* =========================================
   STRING VALIDATION
========================================= */

/* minimum string length */
export const minLength = (n) => (key, value) => {
  if (value.length < n) throw Error(`${key} must be at least ${n} characters`);
};

/* maximum string length */
export const maxLength = (n) => (key, value) => {
  if (value.length > n) throw Error(`${key} must be at most ${n} characters`);
};

/* enforce range */
export const lengthBetween = (min, max) => (key, value) => {
  const len = value.length;

  if (len < min || len > max)
    throw Error(`${key} length must be between ${min}-${max}`);
};

/* regex validation (email, phone, etc.) */
export const match = (regex, message) => (key, value) => {
  if (!regex.test(value)) throw Error(message || `${key} format is invalid`);
};

/* =========================================
   NUMBER VALIDATION
========================================= */

/* minimum number */
export const min = (n) => (key, value) => {
  if (value < n) throw Error(`${key} must be ≥ ${n}`);
};

/* maximum number */
export const max = (n) => (key, value) => {
  if (value > n) throw Error(`${key} must be ≤ ${n}`);
};

/* number range */
export const range = (min, max) => (key, value) => {
  if (value < min || value > max)
    throw Error(`${key} must be between ${min}-${max}`);
};

/* integer only */
export const integer = () => (key, value) => {
  if (!Number.isInteger(value)) throw Error(`${key} must be an integer`);
};

/* positive number */
export const positive = () => (key, value) => {
  if (value <= 0) throw Error(`${key} must be positive`);
};

/* =========================================
   ENUM / CHOICES
========================================= */

/* allow only specific values */
export const oneOf = (list) => (key, value) => {
  if (!list.includes(value))
    throw Error(`${key} must be one of: ${list.join(", ")}`);
};

/* forbid specific values */
export const notOneOf = (list) => (key, value) => {
  if (list.includes(value)) throw Error(`${key} contains forbidden value`);
};

/* =========================================
   DEFAULTS
========================================= */

/* provide default if null/undefined */
export const defaultValue = (def) => (key, value) => value ?? def;

/* dynamic default (based on key/context) */
export const defaultFactory = (fn) => (key, value, ctx) =>
  value ?? fn(key, ctx);

/* =========================================
   TRANSFORMS
========================================= */

/* normalize email */
export const normalizeEmail = () => (key, value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

/* capitalize first letter */
export const capitalize = () => (key, value) =>
  typeof value === "string"
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;

/* clamp number inside range */
export const clamp = (min, max) => (key, value) =>
  Math.min(Math.max(value, min), max);

/* =========================================
   SECURITY
========================================= */

/* omit property entirely */
export const omit = () => () => SKIP;

/* mask sensitive value (passwords, tokens) */
export const mask =
  (replacement = "***") =>
  () =>
    replacement;

/* simple base64 hash (⚠ demo only, not secure) */
export const hash = () => (key, value) => btoa(value);

/* =========================================
   ARRAYS
========================================= */

/* minimum number of items */
export const minItems = (n) => (key, value) => {
  if (!Array.isArray(value) || value.length < n)
    throw Error(`${key} requires at least ${n} items`);
};

/* maximum number of items */
export const maxItems = (n) => (key, value) => {
  if (!Array.isArray(value) || value.length > n)
    throw Error(`${key} max ${n} items allowed`);
};

/* ensure unique items */
export const uniqueItems = () => (key, value) =>
  Array.isArray(value) ? [...new Set(value)] : value;

/* =========================================
   CONDITIONAL
========================================= */

/* -----------------------------------------
   when(predicate, plugin)

   Runs plugin only if predicate returns true.

   Useful for conditional validation.

   Example:
     when(v => v !== null, required())
----------------------------------------- */
export const when = (predicate, plugin) => async (key, value, ctx) => {
  const shouldRun = await predicate(value, ctx);

  if (!shouldRun) return value;

  return plugin(key, value, ctx);
};

/* =========================================
   ASYNC HELPERS
========================================= */

/* async validation (server check, DB lookup) */
export const asyncValidate = (fn, message) => async (key, value, ctx) => {
  const ok = await fn(value, ctx);

  if (!ok) throw Error(message || `${key} invalid`);
};

/* async transformation */
export const asyncTransform = (fn) => async (key, value, ctx) =>
  await fn(value, ctx);
