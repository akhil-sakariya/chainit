// Shared helpers from core
// SKIP        → cancel signal (not heavily used here yet)
// _           → builder wrapper (for nested chains, if extended)
// clone       → immutability helper
// shouldRun   → middleware filter helper
import { SKIP, _, clone, shouldRun } from "./shared.js";

/* =========================================
   ASYNC CHAINER

   Similar API to sync version but:
   - each mutation is queued
   - operations run sequentially
   - supports async middleware/functions
   - $value() returns a Promise

   Example:

     const result = await chainitAsync({})
       .name("John")
       .age(20)
       .$value();

========================================= */

export function chainitAsync(target = {}, options = {}, rootRef) {
  // config
  const { immutable = false, use = [], props = {} } = options;

  // shared root reference (for nested builders if added later)
  const root = rootRef ?? target;

  /* --------------------------------------
     Promise queue

     Ensures tasks run in order:

       task1 -> task2 -> task3

     even if they are async
  -------------------------------------- */
  let queue = Promise.resolve();

  /* --------------------------------------
     Creates a proxy around the current state
     Every chained call returns a NEW proxy
  -------------------------------------- */
  const make = (obj) =>
    new Proxy(obj, {
      get(_, prop) {
        /* ----------------------------------
           Prevent being treated like Promise
           (important for await detection)
        ---------------------------------- */
        if (prop === "then" || prop === "catch" || prop === "finally")
          return undefined;

        /* ----------------------------------
           helpers
        ---------------------------------- */

        // immediate state access (not awaited)
        if (prop === "$target") return obj;

        // root reference
        if (prop === "$root") return root;

        /* ----------------------------------
           $value()
           ONLY place returning a Promise

           waits for queue to finish, then returns state
        ---------------------------------- */
        if (prop === "$value") {
          return () => queue.then(() => obj);
        }

        /* ----------------------------------
           MAIN setter/getter
        ---------------------------------- */
        return (...args) => {
          /* ---------- GETTER ---------- */
          if (args.length === 0) return obj[prop];

          /* ---------- SETTER (async queued) ---------- */
          const task = async () => {
            let value = args[0];

            const ctx = { key: prop, obj, root };

            /* ----------------------------------
               Run middleware sequentially
               each may be async
            ---------------------------------- */
            for (const m of use) {
              value = (await m(prop, value, ctx)) ?? value;
            }

            /* ----------------------------------
               Write state
               immutable → clone
               mutable   → modify directly
            ---------------------------------- */
            const next = immutable ? { ...obj } : obj;

            next[prop] = value;

            obj = next;
          };

          /* ----------------------------------
             Add task to queue

             queue = queue.then(task)
             guarantees ordered execution
          ---------------------------------- */
          queue = queue.then(task);

          /* ----------------------------------
             IMPORTANT:
             Return proxy immediately (NOT Promise)
             so chaining continues naturally:

               chain().a(1).b(2)
          ---------------------------------- */
          return make(obj);
        };
      },
    });

  // return first proxy wrapping target
  return make(target);
}
