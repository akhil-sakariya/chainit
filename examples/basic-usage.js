// Basic usage demo for chainit (sync chainer)
import chainit, { plugin, SKIP, _ } from "../core/index.js";

// Middleware to validate `age` and cancel invalid updates
const validateAge = plugin((key, value) => {
  if (key === "age") {
    if (typeof value !== "number" || value < 0) {
      console.warn("Invalid age, skipping update:", value);
      return SKIP;
    }
  }
});

// Create a chain with global middleware
const user = chainit({ name: "Alice" }, { use: [validateAge] });

user.name(); // getter — returns 'Alice'
user.age(30).city("Berlin"); // setter — returns proxy for chaining

// Nested builder: build a nested `address` object using the `_` helper
user.address(_((c) => c.street("Main St").zip(12345)));

// Immutable mode example — original object preserved
const immutableUser = chainit({ name: "A" }, { immutable: true });
immutableUser.name("B");

console.log("user target:", user.$target);
console.log("immutable user target:", immutableUser.$target);

// Attempt invalid update — this will be ignored by middleware
user.age(-5);

console.log("final user:", user.$target);
