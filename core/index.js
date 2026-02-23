/*
===========================================
  ENTRY / PUBLIC API

  This file defines what users import when they install
  your package (chainit).

  It re-exports:
  - default sync chainer
  - shared helpers
  - async version
===========================================
*/

/* -----------------------------------------
   Default export (SYNC version)

   Most users will use:
     import chainit from "chainit"

   This points to the synchronous chain builder
   implemented in ./sync.js
----------------------------------------- */
import chainit from "./sync.js";

export default chainit;

/* -----------------------------------------
   Re-export shared utilities

   Allows:
     import { SKIP, plugin, _ } from "chainit"

   instead of:
     import { ... } from "chainit/shared"

   Cleaner public API.
----------------------------------------- */
export * from "./shared.js";

/* -----------------------------------------
   Async chainer (named export)

   Provides async/Promise-aware chaining:
     import { chainerAsync } from "chainit"

   Kept separate so:
   - sync stays lightweight
   - async is optional
----------------------------------------- */
export { chainitAsync } from "./async.js";
