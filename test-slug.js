import { generateSlug, generateUniqueSlug } from "./utils/slugUtils.js";

// Test basic slug generation
console.log("Testing basic slug generation:");
console.log(
  '"JavaScript Fundamentals" ->',
  generateSlug("JavaScript Fundamentals")
);
console.log(
  '"React & Node.js Course" ->',
  generateSlug("React & Node.js Course")
);
console.log('"Python 101: Basics" ->', generateSlug("Python 101: Basics"));
console.log(
  '"Web Development (2024)" ->',
  generateSlug("Web Development (2024)")
);

// Test unique slug generation
const mockCheckExists = async (slug) => {
  // Mock function that returns false for most slugs, true for 'javascript-fundamentals'
  return slug === "javascript-fundamentals";
};

console.log("\nTesting unique slug generation:");
generateUniqueSlug("JavaScript Fundamentals", mockCheckExists).then((slug) => {
  console.log('"JavaScript Fundamentals" (with existing slug) ->', slug);
});

generateUniqueSlug("React Course", mockCheckExists).then((slug) => {
  console.log('"React Course" (no conflict) ->', slug);
});
