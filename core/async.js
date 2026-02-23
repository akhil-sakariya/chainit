import { SKIP, _, clone, shouldRun } from "./shared.js";

/* =========================================
   ASYNC CHAINER
========================================= */

export function chainerAsync(target = {}, options = {}, rootRef) {
  const { immutable = false, use = [], props = {} } = options;

  const root = rootRef ?? target;

  let queue = Promise.resolve();

  const make = (obj) =>
    new Proxy(obj, {
      get(_, prop) {
        /* prevent promise-like */
        if (prop === "then" || prop === "catch" || prop === "finally")
          return undefined;

        if (prop === "$target") return obj;
        if (prop === "$root") return root;

        /* only THIS returns promise */
        if (prop === "$value") {
          return () => queue.then(() => obj);
        }

        return (...args) => {
          if (args.length === 0) return obj[prop];

          const task = async () => {
            let value = args[0];

            const ctx = { key: prop, obj, root };

            for (const m of use) {
              value = (await m(prop, value, ctx)) ?? value;
            }

            const next = immutable ? { ...obj } : obj;
            next[prop] = value;

            obj = next;
          };

          queue = queue.then(task);

          /* ⭐ RETURN PROXY, NOT PROMISE */
          return make(obj);
        };
      },
    });

  return make(target);
}
