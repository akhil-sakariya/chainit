/* =========================================
   PROP (FIELD-SPECIFIC) PLUGINS
   Designed for options.props = { field: [] }
========================================= */

import { SKIP } from "../core/index.js";

/* =========================================
   REQUIRED / PRESENCE
========================================= */

/* required value */
export const required = (message) => (key, value) => {
  if (value == null || value === "")
    throw Error(message || `${key} is required`);
};

/* must be defined (but allow empty string) */
export const defined = (message) => (key, value) => {
  if (value === undefined) throw Error(message || `${key} must be defined`);
};

/* =========================================
   STRING VALIDATION
========================================= */

export const minLength = (n) => (key, value) => {
  if (value.length < n) throw Error(`${key} must be at least ${n} characters`);
};

export const maxLength = (n) => (key, value) => {
  if (value.length > n) throw Error(`${key} must be at most ${n} characters`);
};

export const lengthBetween = (min, max) => (key, value) => {
  const len = value.length;
  if (len < min || len > max)
    throw Error(`${key} length must be between ${min}-${max}`);
};

export const match = (regex, message) => (key, value) => {
  if (!regex.test(value)) throw Error(message || `${key} format is invalid`);
};

/* =========================================
   NUMBER VALIDATION
========================================= */

export const min = (n) => (key, value) => {
  if (value < n) throw Error(`${key} must be ≥ ${n}`);
};

export const max = (n) => (key, value) => {
  if (value > n) throw Error(`${key} must be ≤ ${n}`);
};

export const range = (min, max) => (key, value) => {
  if (value < min || value > max)
    throw Error(`${key} must be between ${min}-${max}`);
};

export const integer = () => (key, value) => {
  if (!Number.isInteger(value)) throw Error(`${key} must be an integer`);
};

export const positive = () => (key, value) => {
  if (value <= 0) throw Error(`${key} must be positive`);
};

/* =========================================
   ENUM / CHOICES
========================================= */

export const oneOf = (list) => (key, value) => {
  if (!list.includes(value))
    throw Error(`${key} must be one of: ${list.join(", ")}`);
};

export const notOneOf = (list) => (key, value) => {
  if (list.includes(value)) throw Error(`${key} contains forbidden value`);
};

/* =========================================
   DEFAULTS
========================================= */

export const defaultValue = (def) => (key, value) => value ?? def;

export const defaultFactory = (fn) => (key, value, ctx) =>
  value ?? fn(key, ctx);

/* =========================================
   TRANSFORMS
========================================= */

export const normalizeEmail = () => (key, value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export const capitalize = () => (key, value) =>
  typeof value === "string"
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;

export const clamp = (min, max) => (key, value) =>
  Math.min(Math.max(value, min), max);

/* =========================================
   SECURITY
========================================= */

/* omit field entirely */
export const omit = () => () => SKIP;

/* mask value (store hidden) */
export const mask =
  (replacement = "***") =>
  () =>
    replacement;

/* simple hash (demo only) */
export const hash = () => (key, value) => btoa(value);

/* =========================================
   ARRAYS
========================================= */

export const minItems = (n) => (key, value) => {
  if (!Array.isArray(value) || value.length < n)
    throw Error(`${key} requires at least ${n} items`);
};

export const maxItems = (n) => (key, value) => {
  if (!Array.isArray(value) || value.length > n)
    throw Error(`${key} max ${n} items allowed`);
};

export const uniqueItems = () => (key, value) =>
  Array.isArray(value) ? [...new Set(value)] : value;

/* =========================================
   CONDITIONAL
========================================= */

/* run only if condition true */
export const when = (predicate, plugin) => async (key, value, ctx) => {
  const shouldRun = await predicate(value, ctx);
  if (!shouldRun) return value;

  return plugin(key, value, ctx);
};

/* =========================================
   ASYNC HELPERS
========================================= */

/* async validator */
export const asyncValidate = (fn, message) => async (key, value, ctx) => {
  const ok = await fn(value, ctx);
  if (!ok) throw Error(message || `${key} invalid`);
};

/* async transform */
export const asyncTransform = (fn) => async (key, value, ctx) =>
  await fn(value, ctx);
