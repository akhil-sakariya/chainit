import { SKIP, _, clone, shouldRun } from "./shared.js";

/* =========================================
   SYNC CHAINER (default)
========================================= */

export default function chainit(target = {}, options = {}, rootRef) {
  const { immutable = false, use = [], props = {} } = options;

  const root = rootRef ?? target;

  /* ======================================
     ⭐ SINGLE SHARED STATE (CRITICAL FIX)
  ====================================== */

  let state = target;

  /* --------------------------------------
     middleware
  -------------------------------------- */

  const runList = (list, key, value, ctx) => {
    let v = value;

    for (const item of list) {
      const fn = item.fn || item;

      if (!shouldRun(item, key)) continue;

      const result = fn(key, v, ctx);

      if (result === SKIP) return SKIP;
      if (result !== undefined) v = result;
    }

    return v;
  };

  const runMiddleware = (key, value, ctx) => {
    let v = runList(use, key, value, ctx);
    if (v === SKIP) return SKIP;

    if (props[key]) {
      v = runList(props[key], key, v, ctx);
    }

    return v;
  };

  /* --------------------------------------
     proxy
  -------------------------------------- */

  let proxy;

  const make = () =>
    new Proxy(
      {},
      {
        get(_, prop) {
          /* prevent promise-like */
          if (prop === "then" || prop === "catch" || prop === "finally")
            return undefined;

          /* helpers */
          if (prop === "$target") return state;
          if (prop === "$root") return root;
          if (prop === "$value") return () => state;
          if (prop === Symbol.toPrimitive) return () => state;

          /* tap (side effect) */
          if (prop === "tap") {
            return (fn) => {
              fn(state);
              return proxy;
            };
          }

          /* pipe (transform) */
          if (prop === "pipe") {
            return (fn) => {
              const next = fn(state);
              state = immutable ? clone(next) : next;
              return proxy;
            };
          }

          /* main getter/setter */
          return (...args) => {
            /* getter */
            if (args.length === 0) return state[prop];

            let value = args[0];

            /* nested builder */
            if (typeof value === "function" && value.__isBuilderCallback) {
              const childTarget = {};
              const child = chainer(childTarget, options, root);

              value(child, proxy);
              value = childTarget;
            }

            const ctx = { key: prop, obj: state, root };

            value = runMiddleware(prop, value, ctx);

            if (value === SKIP) return proxy;

            /*  write to shared state */
            const next = immutable ? clone(state) : state;

            next[prop] = value;

            state = next;

            return proxy;
          };
        },
      },
    );

  proxy = make();

  return proxy;
}
