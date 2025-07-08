// utils/slugify.js
export default function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')   // Replace spaces and symbols with hyphens
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
}
