// utils.js

/**
 * Converts an ISO 8601 date string to "DAY MON" format, e.g., "14 JUL"
 * @param {string} isoDate - ISO 8601 formatted date string
 * @returns {string} - Formatted date like "14 JUL"
 */
export function formatDateToDayMonth(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}
