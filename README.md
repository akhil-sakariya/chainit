# chainit — Minimal chainable object builder

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
