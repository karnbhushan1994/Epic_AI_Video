// routes/download.js
import express from "express";
import { pipeline } from "stream";
import { promisify } from "util";
import shopify from '../shopify.js';
const streamPipeline = promisify(pipeline);

const router = express.Router();

router.get("/proxy-download", shopify.validateAuthenticatedSession(), async (req, res) => {
  const { url, filename = "downloaded-file" } = req.query;

  if (!url) return res.status(400).send("Missing URL");

  try {
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch file. Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    // Define allowed MIME types
    const allowedMimeTypes = {
      "video/mp4": "mp4",
      "video/webm": "webm",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp"
    };

    if (!contentType || !allowedMimeTypes[contentType]) {
      return res.status(400).send(`Unsupported file type: ${contentType}`);
    }

    const extension = allowedMimeTypes[contentType];
    const safeFilename = filename.endsWith(`.${extension}`)
      ? filename
      : `${filename}.${extension}`;

    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Type", contentType);

    await streamPipeline(response.body, res);
  } catch (err) {
    console.error("Proxy download failed:", err.message);
    res.status(500).send("Download failed");
  }
});


export default router;
