<p align="center">
	<img src="assets/chainit-logo.svg" alt="chainit logo" width="360" />
</p>

<p align="center"><em>Composable chainable builder for validation, sanitization, defaults, and async pipelines.</em></p>

> Lightweight fluent object chainer with middleware and optional async mode.

This repository contains a small framework (`chainit`) that lets you build and mutate objects using a fluent API. It provides:

- A default synchronous chainer (default export)
- An async-aware chainer (`chainitAsync`) for queued async updates
- Shared helpers and middleware utilities (`SKIP`, `plugin`, `_`, etc.)

**Quick links**
- Example (sync & plugins): [examples/basic-usage.js](examples/basic-usage.js)
- Example (async): [examples/async-usage.js](examples/async-usage.js)

**Files of interest**
- Core implementation: [core/index.js](core/index.js)
- Sync chainer (default): [core/sync.js](core/sync.js)
- Async chainer: [core/async.js](core/async.js)
- Shared helpers: [core/shared.js](core/shared.js)

**Install / use**
This repository is structured as a local module. In projects you would typically import `chainit` as the package entry, which re-exports the sync default and shared helpers.

Example imports (from project root):

```js
import chainit, { chainitAsync, plugin, SKIP, _ } from "./core/index.js";
```

**API summary**
- `chainit(target = {}, options = {})` — default synchronous fluent chainer. Returns a proxy where property access acts as a getter (no args) or setter (pass a value).
- `chainitAsync(target = {}, options = {})` — async-aware version where writes are queued and `$value()` returns a Promise resolving to the final state.
- `plugin(fn, { only, except })` — helper to wrap middleware with `only` / `except` filters.
- `SKIP` — special symbol middleware can return to cancel a write.
- `_` — wrapper to mark nested builder callbacks for nested builders (e.g., `.user(_(c => c.name("x")))`).

See implementation comments in `core/` files for more details.

**Creating a chainer (concepts & params)**

Use `chainit()` to create a fluent chainer. The function signature and concepts:

- `chainit(target = {}, options = {}, rootRef)`
	- `target` — the initial object that the chainer will read from and (by default) mutate.
	- `options` — configuration object with keys:
		- `immutable` (boolean, default `false`) — when `true` each write produces a shallow clone of the state (`clone()`), leaving previous objects unchanged.
		- `use` (array) — global middleware / plugins applied to every property write. Each item may be a plain function `(key, value, ctx) => newValue|SKIP|undefined` or a value created by `plugin()` which contains `fn`, `only` and/or `except` metadata.
		- `props` (object) — per-property middleware mapping. Example: `{ age: [plugin(validate, { only: ['age'] })] }`. Property-specific middleware runs after global `use` middleware.
	- `rootRef` — internal hook used when creating nested child builders so they share a single root reference. Normal users won't need to pass this.

How middleware runs
- Global middleware from `options.use` runs first.
- If `options.props[key]` exists, those middleware functions run next for that specific property.
- Middleware can return:
	- `SKIP` (special symbol) to cancel the update for that property (write is ignored but chain continues),
	- a new value to replace the incoming value,
	- or `undefined` to keep the value unchanged.
- Use `plugin(fn, { only, except })` to attach `only`/`except` filters that `shouldRun()` respects (run only for named keys or skip named keys).

Prop-level vs global plugins
- Global plugins (`use`) are convenient for cross-cutting concerns (trimming all strings, logging, casting).
- Prop-level plugins (`props`) are for targeted behaviour (validate `age` only, sanitize `comment` only).

Proxy helpers and special keys
- `.$target` — returns the current internal state object (synchronous chainer).
- `.$root` — shared root object reference for nested builders.
- `.$value()` — in sync chainer returns the whole state; in `chainitAsync` this returns a Promise that resolves after queued tasks complete.
- `.tap(fn)` — run a side-effect with the current state and return the proxy for chaining.
- `.pipe(fn)` — transform the whole state using `fn(state)` and replace state (respects `immutable` option).
- `Symbol.toPrimitive` — implemented to allow primitive coercion (e.g., `console.log(proxy)` prints the underlying object).
- The proxy intentionally returns `undefined` for `.then`, `.catch`, `.finally` to avoid being treated as a Promise.

Nested builder callbacks
- Use `_` to wrap a callback that receives a child builder. Example:

```js
import chainit, { _ } from "./core/index.js";

const c = chainit({});
c.user(_((u) => u.name("Anna").age(20)));
// child builder automatically writes the constructed object into `user`
```

`chainitAsync` differences
- Writes are queued and executed sequentially to preserve order even across async middleware.
- `$value()` returns a Promise resolving to the latest state once the queue is drained.
- Async middleware may `await` remote checks and may return `SKIP` to cancel updates.

Writing plugins (authoring guide)
---------------------------------
Plugins are just middleware functions. They can be plain functions `(key, value, ctx) => newValue|SKIP|undefined` or wrapped with `plugin()` to attach metadata (`only`, `except`).

1) Global plugin

```js
// A global plugin that trims strings and logs writes
import { plugin } from "./core/index.js";

function trimAndLog(key, value, ctx) {
	const v = typeof value === "string" ? value.trim() : value;
	console.log("write", key, "=>", v);
	return v; // return modified value
}

// attach globally via `use`
const ch = chainit({}, { use: [trimAndLog] });
ch.name("  Alice  "); // value trimmed by plugin
```

2) Prop-level plugin

```js
// plugin that only runs for `age` and validates range
import { plugin, SKIP } from "./core/index.js";

const validateAge = plugin((k, v) => {
	const n = Number(v);
	if (Number.isNaN(n) || n < 0) return SKIP; // cancel invalid write
	return n; // cast to number
});

// attach via `props` so it runs only for `age`
const ch2 = chainit({}, { props: { age: [validateAge] } });
ch2.age("30"); // becomes number 30
ch2.age(-5); // ignored
```

3) Using `plugin()` metadata: `only` / `except`

```js
// plugin wrapper supports selective execution
const allTrim = plugin((k, v) => (typeof v === 'string' ? v.trim() : v));

// only run for these keys
const nameOnly = plugin((k, v) => v, { only: ["name"] });

const ch3 = chainit({}, { use: [allTrim, nameOnly] });
```

4) Async plugin for `chainitAsync`

```js
// async uniqueness check used with chainitAsync
const uniqueCheck = async (k, v) => {
	if (k !== 'username') return v;
	const available = await remoteCheckUsername(v);
	if (!available) return SKIP;
	return v;
};

const asyncCh = chainitAsync({}, { use: [uniqueCheck] });
asyncCh.username('bob');
const final = await asyncCh.$value();
```

Integration tips
- Order matters: global `use` middleware runs before `props[key]` middleware.
- Middleware should return `undefined` to leave the value unchanged, a value to replace it, or `SKIP` to cancel the write.
- Keep middleware pure where possible; use `.tap()` for side effects.



**Examples**
See the `examples/` folder for runnable examples demonstrating sync chaining, middleware/plugins, nested builders, and async usage.
**Use Cases**
This library is intentionally small but powerful. Common real-world uses include:

- API validation: reject or sanitize invalid fields before accepting updates.
- Form cleaning: trim, normalize and drop empty fields coming from user input.
- Type casting: convert strings to numbers, booleans, arrays, etc., consistently.
- Defaults: provide default values and only overwrite when present.
- Sanitization: strip dangerous HTML or escape user-provided content.
- Async checks: perform async validations (uniqueness, remote lookups) with `chainitAsync`.
- Data pipelines: use `.pipe()` to transform whole objects or compose transforms.

Examples that cover these cases are provided in [examples/usecases.js](examples/usecases.js).

Quick snippets

- Validation plugin (sync):

```js
import chainit, { plugin, SKIP } from "./core/index.js";

const validateAge = plugin((key, value) => {
	if (key === "age" && (typeof value !== "number" || value < 0)) return SKIP;
});

const c = chainit({}, { use: [validateAge] });
c.age(-1); // ignored by middleware
```

- Form cleaning + type casting (sync):

```js
import chainit, { plugin, _ } from "./core/index.js";

const trim = plugin((k, v) => (typeof v === "string" ? v.trim() : v));
const toNumber = plugin((k, v) => (k === "age" ? Number(v) : v));

const c = chainit({}, { use: [trim, toNumber] });
c.name("  Alice  ").age("30").address(_((a) => a.street(" Main ")));
```

- Async checks (async):

```js
import { chainitAsync } from "./core/index.js";

const uniqueCheck = async (k, v) => {
	if (k === "username") {
		await someRemoteCheck(v);
		return v;
	}
	return v;
};

const ch = chainitAsync({}, { use: [uniqueCheck] });
ch.username("bob");
const final = await ch.$value();
```

Run examples

From the project root (Node.js installed):

```bash
node examples/basic-usage.js
node examples/async-usage.js
node examples/usecases.js
```

**License**
See the `LICENSE` file in the repository root.
