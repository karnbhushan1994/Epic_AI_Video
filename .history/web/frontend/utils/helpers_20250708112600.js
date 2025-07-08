// File validation utility
export const validateFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: `${file.name} is not a valid image file.` };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: `${file.name} exceeds 10MB.` };
  }
  return { valid: true };
};

// Convert File to Base64
export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Check if a URL is valid and well-formed
export const isValidImageUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
