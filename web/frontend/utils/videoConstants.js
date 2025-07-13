// Video durations with labels and credits
export const VIDEO_DURATIONS = [
  { index: 0, label: "5s", value: "5", credits: 1.6 },
  { index: 1, label: "10s", value: "10", credits: 1.6 },
];

// Video modes for rendering quality
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

// Tab indexes
export const TABS = {
  UPLOAD: 0,
  PRODUCTS: 1,
};

// File constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Default motion prompt used in video generation
export const STATIC_MOTION_PROMPT =
  "The camera slowly zooms in while maintaining smooth, natural movement. The subject remains in focus with subtle, realistic motion that enhances the overall visual appeal.";

// API configuration
export const API_CONFIG = {
  baseUrl: "/api/v1/app",
};


export const VIDEO_STATUS = {
  IDLE: "IDLE",
  CREATED: "CREATED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ERROR: "ERROR",
};


export  const getStatusMessage = (status) => {
  switch ((status || "").toUpperCase()) {
    case "CREATED":
      return "Task created, preparing...";
    case "IN_PROGRESS":
      return "Generating video...";
    case "COMPLETED":
      return "Video generation COMPLETED!";
    case "FAILED":
      return "Video generation FAILED.";
    case "ERROR":
      return "An error occurred.";
    default:
      return "Waiting to start...";
  }
};


export  const getStatusTone = (status) => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
    case "CREATED":
      return "attention";
    case "FAILED":
    case "ERROR":
      return "critical";
    default:
      return "subdued";
  }
};
