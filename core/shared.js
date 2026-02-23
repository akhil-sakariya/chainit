/* =========================================
   SHARED
========================================= */

export const SKIP = Symbol("chainer.skip");

export function plugin(fn, options = {}) {
  return {
    fn,
    only: options.only,
    except: options.except,
  };
}

export function _(fn) {
  const wrapper = (child, root) => fn(child, root);
  wrapper.__isBuilderCallback = true;
  return wrapper;
}

export const clone = (obj) => (Array.isArray(obj) ? [...obj] : { ...obj });

export const shouldRun = (item, key) => {
  if (item.only && !item.only.includes(key)) return false;
  if (item.except && item.except.includes(key)) return false;
  return true;
};
