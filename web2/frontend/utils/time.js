/**
 * Function to parse a video duration in 'MM:SS' format to total seconds
 * @param {string} durationStr - Duration in 'MM:SS' format (e.g., '02:30')
 * @returns {number} - Total duration in seconds
 */
export const parseDuration = (durationStr) => {
  // Handle undefined/null/empty strings by defaulting to "00:00"
  if (!durationStr || typeof durationStr !== 'string') {
    durationStr = '00:00';
  }

  const parts = durationStr.split(':');
  if (parts.length !== 2) {
    console.warn(`Invalid duration format: ${durationStr}. Expected MM:SS format.`);
    return 0;
  }

  const [minutes, seconds] = parts.map(Number);

  // Handle NaN values
  if (isNaN(minutes) || isNaN(seconds)) {
    console.warn(`Non-numeric values in duration: ${durationStr}`);
    return 0;
  }

  return (minutes * 60) + seconds;
};
