import { MAX_FILE_SIZE } from "./videoConstants";

/**
 * Validates an image file.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: `${file.name} is not a valid image file` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name} is too large (max 10MB)` };
  }

  return { valid: true };
};
/**
 * Validates a list of files.
 * @param {File[]} files
 * @returns {{ valid: boolean, errors?: string[] }}
 */