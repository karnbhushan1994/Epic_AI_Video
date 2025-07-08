// Video durations available for generation
export const VIDEO_DURATIONS = [
  { index: 0, label: "5s", value: "5", credits: 1.6 },
  { index: 1, label: "10s", value: "10", credits: 1.6 },
];

// Video modes available
export const VIDEO_MODES = [
  {
    index: 0,
    label: "Std",
    value: "std",
    credits: 1.6,
    endpoint: "kling-std",
  },
  {
    index: 1,
    label: "Pro",
    value: "pro",
    credits: 1.6,
    endpoint: "kling-pro",
  },
];

// Tab constants
export const TABS = {
  UPLOAD: 0,
  PRODUCTS: 1,
};

// Static motion prompt for generation
export const STATIC_MOTION_PROMPT =
  "The camera slowly zooms in while maintaining smooth, natural movement. The subject remains in focus with subtle, realistic motion that enhances the overall visual appeal.";

// Max file size = 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported image MIME types
export const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
