function randomString(length = 4) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a URL-friendly slug from a string, prepending a random string
 * @param {string} text - The text to convert to slug
 * @returns {string} - The generated slug
 */
export const generateSlug = (text) => {
  if (!text) return randomString();
  const slugified = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return `${randomString()}-${slugified}`;
};

/**
 * Generate a unique slug for a course
 * @param {string} name - The course name
 * @param {Function} checkExists - Function to check if slug already exists
 * @returns {Promise<string>} - The unique slug
 */
export const generateUniqueSlug = async (name, checkExists) => {
  let slug = generateSlug(name);
  let counter = 1;

  while (await checkExists(slug)) {
    // If collision, generate a new random string and try again
    slug = generateSlug(name);
    counter++;
    if (counter > 10) break; // Prevent infinite loop
  }

  return slug;
};
