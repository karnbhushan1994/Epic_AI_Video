// src/api/videoApi.js

export const generateVideo = async (params) => {
  try {
    const response = await fetch("/api/video/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "FAILED to start video generation");
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.jobId,     // Unique ID for polling
      url: data.url || "",   // Optional: pre-resolved URL
    };
  } catch (error) {
    console.error("generateVideo error:", error);
    return { success: false, error: error.message };
  }
};

// 🔁 Polling function
export const pollVideoStatus = async (jobId) => {
  try {
    const response = await fetch(`/api/video/status/${jobId}`, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "FAILED to fetch video status");
    }

    const data = await response.json();

    return {
      success: true,
      status: data.status, // e.g., "IN_PROGRESS", "COMPLETED"
      progress: data.progress, // e.g., 45
      url: data.url || null,
    };
  } catch (error) {
    console.error("pollVideoStatus error:", error);
    return { success: false, error: error.message };
  }
};
