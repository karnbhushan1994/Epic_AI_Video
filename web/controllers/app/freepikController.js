// 📁 controllers/app/freepikController.js
import fetch from 'node-fetch';

const FREEPIK_API_KEY = "FPSXa758644ef64e2e50ccaf18f58698c420";

// Core function to call Freepik video generation API
export const callFreepikGenerateVideo = async (payload) => {
  const response = await fetch("https://api.freepik.com/v1/ai/image-to-video/kling-v2-1-std", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": FREEPIK_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return response.json();
};

// Core function to call Freepik status check API
export const callFreepikCheckStatus = async (taskId) => {
  const response = await fetch(`https://api.freepik.com/v1/ai/image-to-video/kling-v2-1/${taskId}`, {
    method: "GET",
    headers: {
      "x-freepik-api-key": FREEPIK_API_KEY,
    },
  });
  return response.json();
};

// Express.js middleware for video generation
export const generateVideo = async (req, res) => {
  try {
    const result = await callFreepikGenerateVideo(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("Freepik generateVideo error:", err);
    res.status(500).json({ error: "FAILED to generate video from Freepik" });
  }
};

// Express.js middleware for status check
export const checkStatus = async (req, res) => {
  const { taskId } = req.params;
  try {
    const result = await callFreepikCheckStatus(taskId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Freepik checkStatus error:", err);
    res.status(500).json({ error: "FAILED to check video status from Freepik" });
  }
};

// Express.js middleware for background removal
export const removeBackground = async (req, res) => {
  try {
    const { image_url, t } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: "Missing image_url in request body." });
    }

    const formData = new URLSearchParams();
    formData.append("image_url", image_url);
    if (t) formData.append("t", t); // Optional token param

    const response = await fetch("https://api.freepik.com/v1/ai/beta/remove-background", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: formData,
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON from Freepik", raw: text });
    }

    console.log("✅ Freepik response:", data);

    if (data?.url || data?.high_resolution) {
      return res.status(200).json({
        success: true,
        processedImageUrl: data.url || data.high_resolution,
        originalImageUrl: data.original,
        high_resolution: data.high_resolution,
        preview: data.preview,
        original: data.original,
      });
    }

    return res.status(400).json({
      success: false,
      error: "No processed image returned from Freepik.",
      raw: data,
    });
  } catch (err) {
    console.error("❌ Error calling Freepik API:", err);
    res.status(500).json({ error: "Background removal FAILED." });
  }
};



