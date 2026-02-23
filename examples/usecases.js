// Examples covering common use cases:
// - API validation
// - Form cleaning
// - Type casting
// - Defaults
// - Sanitization
// - Async checks
// - Data pipelines

import chainit, { plugin, SKIP, _ } from "../core/index.js";
import { chainitAsync } from "../core/index.js";

console.log("--- Usecases (sync) ---");

// 1) Defaults
const defaults = { role: "guest", active: false };
const user = chainit({ ...defaults }, {});
user.name("Eve");
console.log("defaults applied:", user.$target);

// 2) Type casting (age should be number)
const castNumber = plugin((k, v) => (k === "age" ? Number(v) : v));
const trimmer = plugin((k, v) => (typeof v === "string" ? v.trim() : v));

const form = chainit({}, { use: [trimmer, castNumber] });
form.name("  Mona  ").age("42").bio(" hello ");
console.log("after trim + cast:", form.$target);

// 3) Validation — reject invalid email/age
const validate = plugin((k, v) => {
  if (k === "email") {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return SKIP;
  }
  if (k === "age") {
    if (Number.isNaN(Number(v)) || Number(v) < 0) return SKIP;
  }
});

const reg = chainit({}, { use: [trimmer, validate] });
reg.email("bad-email"); // skipped
reg.email("ok@example.com");
reg.age(-5); // skipped
reg.age(25);
console.log("validated:", reg.$target);

// 4) Sanitization — simple HTML strip
const stripScripts = plugin((k, v) => {
  if (typeof v === "string") return v.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  return v;
});

const san = chainit({}, { use: [stripScripts] });
san.comment("Hello<script>alert(1)</script>");
console.log("sanitized:", san.$target);

// 5) Form cleaning pipeline — drop empty values using .pipe()
const dirty = chainit({});
dirty.name("  ").age(0).note("");

dirty.pipe((obj) => {
  const cleaned = {};
  for (const k in obj) {
    const v = obj[k];
    if (v !== "" && v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")) cleaned[k] = v;
  }
  return cleaned;
});

console.log("cleaned:", dirty.$target);

// 6) Nested builder + defaults
const p = chainit({ user: { role: "guest" } });
p.user(_((u) => u.name("Nested") ));
console.log("nested:", p.$target);

// 7) Data pipeline composition: use .pipe() to add derived fields
const pipeline = chainit({ first: "John", last: "Doe" });
pipeline.pipe((o) => ({ ...o, full: `${o.first} ${o.last}` }));
console.log("pipeline derived:", pipeline.$target);

// --- Async example: uniqueness check ---
console.log("\n--- Usecases (async) ---");

async function asyncChecks() {
  // fake remote set
  const taken = new Set(["user1", "alice"]);

  const usernameCheck = async (k, v) => {
    if (k === "username") {
      // simulate network latency
      await new Promise((r) => setTimeout(r, 30));
      if (taken.has(v)) return SKIP; // reserved
      return v;
    }
    return v;
  };

  const ch = chainitAsync({}, { use: [usernameCheck] });
  ch.username("alice"); // will be skipped
  ch.username("new_user"); // ok

  const out = await ch.$value();
  console.log("async final:", out);
}

asyncChecks();
