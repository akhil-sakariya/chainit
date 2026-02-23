// Async usage demo for chainitAsync
import { chainitAsync } from "../core/index.js";

// Async middleware example — pretend to validate/transform value asynchronously
const asyncValidate = async (key, value) => {
  if (key === "name") {
    // simulate async check
    await new Promise((r) => setTimeout(r, 50));
    return String(value).trim();
  }
  return value;
};

async function run() {
  const ch = chainitAsync({}, { use: [asyncValidate] });

  // Chaining is immediate; writes are queued.
  ch.name("  Bob  ").age(28);

  // Wait for queue to complete and get final object
  const result = await ch.$value();

  console.log("async result:", result);
}

run();
