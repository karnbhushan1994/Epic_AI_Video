import axios from "axios";

export const generateVideo = async function (req, res) {
  try {
    console.log("🎬 Generating video with Freepik API...");

    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "No active session found" });
    }

    const { image, prompt, duration, ...otherParams } = req.body;

    if (!image || !duration) {
      return res.status(400).json({ error: "Missing required fields: image and duration" });
    }

    const response = await axios.post(
      `https://api.freepik.com/v1/ai/image-to-video/kling-v2-1-pro`,
      {
        image,               // base64 or URL
        prompt: prompt || "Smooth cinematic zoom",
        duration: duration,  // '5' or '10'
        ...otherParams       // optional config
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FREEPIK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Video generation API response received.");
    res.status(200).json(response.data);

  } catch (error) {
    console.error("❌ Error generating video:", error?.response?.data || error.message);

    // Handle Freepik-specific error response
    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json({
        error: "Freepik API error",
        details: data,
      });
    }

    // Generic fallback
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
