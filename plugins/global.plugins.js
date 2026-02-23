/* =========================================
   GLOBAL PLUGINS
   Runs on every assignment (unless filtered
   via plugin(..., { only / except }))
========================================= */

import { SKIP } from "../core/index.js";

/* =========================================
   LOGGING / DEBUG
========================================= */

/* log every assignment */
export const logger =
  (label = "chainer") =>
  (key, value, ctx) => {
    console.log(`[${label}] ${String(key)} →`, value);
  };

/* detailed debug log */
export const debugLogger = () => (key, value, ctx) => {
  console.log({
    key,
    value,
    current: ctx.obj,
    root: ctx.root,
  });
};

/* freeze objects to avoid mutation bugs */
export const freezeValues = () => (key, value) =>
  value && typeof value === "object" ? Object.freeze(value) : value;

/* deep freeze (safer debug mode) */
export const deepFreeze = () => (key, value) => {
  const freeze = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    Object.freeze(obj);
    Object.values(obj).forEach(freeze);
    return obj;
  };
  return freeze(value);
};

/* =========================================
   STRING SANITIZATION
========================================= */

/* trim whitespace */
export const trimStrings = () => (key, value) =>
  typeof value === "string" ? value.trim() : value;

/* collapse multiple spaces */
export const normalizeSpaces = () => (key, value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ") : value;

/* lowercase */
export const toLower = () => (key, value) =>
  typeof value === "string" ? value.toLowerCase() : value;

/* uppercase */
export const toUpper = () => (key, value) =>
  typeof value === "string" ? value.toUpperCase() : value;

/* =========================================
   TYPE TRANSFORMS
========================================= */

/* string -> number */
export const toNumber = () => (key, value) =>
  typeof value === "string" && value !== "" && !isNaN(value)
    ? Number(value)
    : value;

/* string -> boolean */
export const toBoolean = () => (key, value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

/* null -> undefined */
export const nullToUndefined = () => (key, value) =>
  value === null ? undefined : value;

/* undefined -> null */
export const undefinedToNull = () => (key, value) =>
  value === undefined ? null : value;

/* JSON string -> object */
export const parseJSON = () => (key, value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/* =========================================
   DEFAULTS / FALLBACKS
========================================= */

/* set default if empty */
export const defaultIfEmpty = (def) => (key, value) =>
  value == null || value === "" ? def : value;

/* auto timestamp */
export const timestamp = () => () => Date.now();

/* auto uuid (browser/modern node) */
export const uuid = () => () => crypto.randomUUID();

/* =========================================
   ARRAY HELPERS
========================================= */

/* ensure value is array */
export const ensureArray = () => (key, value) =>
  Array.isArray(value) ? value : [value];

/* remove duplicates */
export const uniqueArray = () => (key, value) =>
  Array.isArray(value) ? [...new Set(value)] : value;

/* =========================================
   SECURITY / CLEANING
========================================= */

/* omit empty strings */
export const omitEmptyStrings = () => (key, value) =>
  value === "" ? SKIP : value;

/* omit undefined */
export const omitUndefined = () => (key, value) =>
  value === undefined ? SKIP : value;

/* simple mask for logs */
export const mask =
  (replacement = "***") =>
  () =>
    replacement;

/* =========================================
   PERFORMANCE / META
========================================= */

/* measure middleware time */
export const measureTime = () => async (key, value, ctx) => {
  const start = performance.now();
  const result = value;
  const end = performance.now();
  console.log(`${String(key)} took ${end - start}ms`);
  return result;
};

/* artificial delay (testing async chains) */
export const delay =
  (ms = 100) =>
  async (key, value) => {
    await new Promise((r) => setTimeout(r, ms));
    return value;
  };
