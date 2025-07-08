
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY; // Securely store in .env

// POST /api/freepik/generate-video
exports.generateVideo = async (req, res) => {
  try {
    const response = await fetch("https://api.freepik.com/v1/ai/image-to-video/kling-v2-1-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (err) {
    console.error("Freepik generateVideo error:", err);
    res.status(500).json({ error: "Failed to generate video from Freepik" });
  }
};

// GET /api/freepik/check-status/:taskId
exports.checkStatus = async (req, res) => {
  const { taskId } = req.params;

  try {
    const response = await fetch(`https://api.freepik.com/v1/ai/image-to-video/kling-v2-1/${taskId}`, {
      method: "GET",
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (err) {
    console.error("Freepik checkStatus error:", err);
    res.status(500).json({ error: "Failed to check video status from Freepik" });
  }
};
