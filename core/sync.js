// Import shared helpers
// SKIP → signal to stop a middleware/update
// _ → wildcard matcher (likely for middleware keys)
// clone → deep/shallow clone utility for immutability
// shouldRun → decides if middleware should execute for a key
import { SKIP, _, clone, shouldRun } from "./shared.js";

/* =========================================
   SYNC CHAINER (default)
   Core builder that enables fluent chaining:
   chainit(obj).name("John").age(20)
========================================= */

export default function chainit(target = {}, options = {}, rootRef) {
  // options
  // immutable → create new state on every write
  // use → global middleware
  // props → per-property middleware
  const { immutable = false, use = [], props = {} } = options;

  // root reference shared across nested builders
  const root = rootRef ?? target;

  /* ======================================
     SINGLE SHARED STATE
     All chained operations mutate/replace THIS
     single state object. This keeps chaining
     consistent across nested calls.
  ====================================== */

  let state = target;

  /* --------------------------------------
     middleware helpers
  -------------------------------------- */

  // Runs a list of middleware functions sequentially
  // Each middleware can:
  //  - modify value
  //  - return SKIP to cancel
  const runList = (list, key, value, ctx) => {
    let v = value;

    for (const item of list) {
      const fn = item.fn || item;

      // skip if middleware shouldn't run for this key
      if (!shouldRun(item, key)) continue;

      const result = fn(key, v, ctx);

      // cancel entire update
      if (result === SKIP) return SKIP;

      // if value returned → replace
      if (result !== undefined) v = result;
    }

    return v;
  };

  // Runs global middleware first, then property-specific
  const runMiddleware = (key, value, ctx) => {
    let v = runList(use, key, value, ctx);
    if (v === SKIP) return SKIP;

    // property-specific middleware
    if (props[key]) {
      v = runList(props[key], key, v, ctx);
    }

    return v;
  };

  /* --------------------------------------
     proxy creation
     This is the magic that enables:
     chainit(obj).name("John").age(20)
  -------------------------------------- */

  let proxy;

  const make = () =>
    new Proxy(
      {},
      {
        // Intercepts ANY property access
        get(_, prop) {
          /* ----------------------------------
             Prevent promise-like behavior
             (avoid being treated as a Promise)
          ---------------------------------- */
          if (prop === "then" || prop === "catch" || prop === "finally")
            return undefined;

          /* ----------------------------------
             Internal helpers
          ---------------------------------- */

          // current state
          if (prop === "$target") return state;

          // root reference
          if (prop === "$root") return root;

          // function to get whole value
          if (prop === "$value") return () => state;

          // allow primitive coercion (console.log, +, etc.)
          if (prop === Symbol.toPrimitive) return () => state;

          /* ----------------------------------
             tap → side effects only
             Does NOT change state
             Example:
             .tap(v => console.log(v))
          ---------------------------------- */
          if (prop === "tap") {
            return (fn) => {
              fn(state);
              return proxy;
            };
          }

          /* ----------------------------------
             pipe → transform whole state
             Example:
             .pipe(v => ({ ...v, extra: true }))
          ---------------------------------- */
          if (prop === "pipe") {
            return (fn) => {
              const next = fn(state);

              // immutable mode clones
              state = immutable ? clone(next) : next;

              return proxy;
            };
          }

          /* ----------------------------------
             MAIN getter/setter
             Allows:
             .name()        -> get
             .name("John")  -> set
          ---------------------------------- */
          return (...args) => {
            /* ---------- GETTER ---------- */
            if (args.length === 0) return state[prop];

            let value = args[0];

            /* ---------- NESTED BUILDER ---------- */
            // Allows:
            // .user(c => c.name("John"))
            if (typeof value === "function" && value.__isBuilderCallback) {
              const childTarget = {};

              // create child chain with shared options/root
              const child = chainer(childTarget, options, root);

              value(child, proxy);

              value = childTarget;
            }

            const ctx = { key: prop, obj: state, root };

            /* ---------- middleware ---------- */
            value = runMiddleware(prop, value, ctx);

            // cancelled
            if (value === SKIP) return proxy;

            /* ---------- write ---------- */

            // clone or mutate based on immutable mode
            const next = immutable ? clone(state) : state;

            next[prop] = value;

            state = next;

            // return proxy to keep chaining
            return proxy;
          };
        },
      },
    );

  // create proxy instance
  proxy = make();

  // return chainable object
  return proxy;
}
