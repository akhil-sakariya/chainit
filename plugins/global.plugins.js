/* =========================================
   GLOBAL PLUGINS

   Collection of reusable middleware helpers
   for chainit.

   These run on every assignment unless filtered
   using:
     plugin(fn, { only, except })

   Signature every plugin follows:

     (key, value, ctx) => newValue | SKIP | undefined

   return value → replace value
   return undefined → keep original
   return SKIP → cancel assignment
========================================= */

import { SKIP } from "../core/index.js";

/* =========================================
   LOGGING / DEBUG
========================================= */

/* -----------------------------------------
   logger(label)

   Logs every assignment in simple format

   Example:
     use: [logger("user")]

   Output:
     [user] name → John
----------------------------------------- */
export const logger =
  (label = "chainer") =>
  (key, value, ctx) => {
    console.log(`[${label}] ${String(key)} →`, value);
  };

/* -----------------------------------------
   debugLogger()

   More detailed logging including:
   - key
   - value
   - current object
   - root object

   Useful when debugging complex chains
----------------------------------------- */
export const debugLogger = () => (key, value, ctx) => {
  console.log({
    key,
    value,
    current: ctx.obj,
    root: ctx.root,
  });
};

/* -----------------------------------------
   freezeValues()

   Shallow freezes assigned objects to prevent
   accidental mutation bugs.

   Good for debugging state safety.
----------------------------------------- */
export const freezeValues = () => (key, value) =>
  value && typeof value === "object" ? Object.freeze(value) : value;

/* -----------------------------------------
   deepFreeze()

   Recursively freezes nested objects.

   Slower but safer. Useful in development mode.
----------------------------------------- */
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

/* remove leading/trailing spaces */
export const trimStrings = () => (key, value) =>
  typeof value === "string" ? value.trim() : value;

/* collapse multiple spaces into one */
export const normalizeSpaces = () => (key, value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ") : value;

/* convert to lowercase */
export const toLower = () => (key, value) =>
  typeof value === "string" ? value.toLowerCase() : value;

/* convert to uppercase */
export const toUpper = () => (key, value) =>
  typeof value === "string" ? value.toUpperCase() : value;

/* =========================================
   TYPE TRANSFORMS
========================================= */

/* convert numeric string → number */
export const toNumber = () => (key, value) =>
  typeof value === "string" && value !== "" && !isNaN(value)
    ? Number(value)
    : value;

/* convert "true"/"false" → boolean */
export const toBoolean = () => (key, value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

/* null → undefined */
export const nullToUndefined = () => (key, value) =>
  value === null ? undefined : value;

/* undefined → null */
export const undefinedToNull = () => (key, value) =>
  value === undefined ? null : value;

/* JSON string → object */
export const parseJSON = () => (key, value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value; // fail silently
  }
};

/* =========================================
   DEFAULTS / FALLBACKS
========================================= */

/* set default value if empty/null */
export const defaultIfEmpty = (def) => (key, value) =>
  value == null || value === "" ? def : value;

/* auto timestamp (Date.now()) */
export const timestamp = () => () => Date.now();

/* auto UUID (modern browsers / Node 19+) */
export const uuid = () => () => crypto.randomUUID();

/* =========================================
   ARRAY HELPERS
========================================= */

/* ensure result is always an array */
export const ensureArray = () => (key, value) =>
  Array.isArray(value) ? value : [value];

/* remove duplicate entries */
export const uniqueArray = () => (key, value) =>
  Array.isArray(value) ? [...new Set(value)] : value;

/* =========================================
   SECURITY / CLEANING
========================================= */

/* skip empty string assignments entirely */
export const omitEmptyStrings = () => (key, value) =>
  value === "" ? SKIP : value;

/* skip undefined values */
export const omitUndefined = () => (key, value) =>
  value === undefined ? SKIP : value;

/* mask value (for logs or secrets) */
export const mask =
  (replacement = "***") =>
  () =>
    replacement;

/* =========================================
   PERFORMANCE / META
========================================= */

/* measure middleware execution time */
export const measureTime = () => async (key, value, ctx) => {
  const start = performance.now();

  const result = value;

  const end = performance.now();

  console.log(`${String(key)} took ${end - start}ms`);

  return result;
};

/* artificial delay (useful for testing async chains) */
export const delay =
  (ms = 100) =>
  async (key, value) => {
    await new Promise((r) => setTimeout(r, ms));
    return value;
  };
