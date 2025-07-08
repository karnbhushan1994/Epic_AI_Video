import fetch from "node-fetch"; // or global fetch in Node >=18

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

    const payload = {
      image,
      prompt: prompt || "Smooth cinematic zoom",
      duration,
      ...otherParams,
    };

    const freepikResponse = await fetch("https://api.freepik.com/v1/ai/image-to-video/kling-v2-1-pro", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FREEPIK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!freepikResponse.ok) {
      const errorData = await freepikResponse.json();
      console.error("❌ Freepik API error:", errorData);
      return res.status(freepikResponse.status).json({
        error: "Freepik API error",
        details: errorData,
      });
    }

    const result = await freepikResponse.json();

    console.log("✅ Video generation API response received.");
    res.status(200).json(result);

  } catch (error) {
    console.error("❌ Error generating video:", error.message);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
