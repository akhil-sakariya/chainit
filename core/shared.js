/* =========================================
   SHARED UTILITIES
   Common helpers used by chainit core
========================================= */

/* -----------------------------------------
   SKIP
   Special symbol used by middleware to cancel
   an update.

   If middleware returns SKIP:
     → property write is ignored
     → chain continues safely
----------------------------------------- */
export const SKIP = Symbol("chainer.skip");

/* -----------------------------------------
   plugin()
   Wraps a middleware function with metadata.

   fn      → middleware function
   only    → run ONLY for these keys
   except  → skip these keys

   Example:
     plugin(validateAge, { only: ["age"] })

   Allows selective middleware execution.
----------------------------------------- */
export function plugin(fn, options = {}) {
  return {
    fn,
    only: options.only,
    except: options.except,
  };
}

/* -----------------------------------------
   _ (builder wrapper)
   Marks a function as a "nested builder callback".

   Enables:
     .user(_(c => c.name("John")))

   The chain core detects __isBuilderCallback
   and creates a child chain automatically.

   Why needed?
   Because we must distinguish between:
     - normal function value
     - builder callback
----------------------------------------- */
export function _(fn) {
  const wrapper = (child, root) => fn(child, root);

  // special internal flag checked by chainit
  wrapper.__isBuilderCallback = true;

  return wrapper;
}

/* -----------------------------------------
   clone()
   Shallow clone helper for immutable mode.

   Used when options.immutable = true

   Arrays → new array copy
   Objects → shallow object copy

   Keeps state updates predictable.
----------------------------------------- */
export const clone = (obj) => (Array.isArray(obj) ? [...obj] : { ...obj });

/* -----------------------------------------
   shouldRun()
   Decides whether a middleware should execute
   for a given property key.

   Rules:
   - if "only" exists → run only for those keys
   - if "except" exists → skip those keys
   - otherwise → run for all

   Used by middleware runner.
----------------------------------------- */
export const shouldRun = (item, key) => {
  if (item.only && !item.only.includes(key)) return false;
  if (item.except && item.except.includes(key)) return false;
  return true;
};
