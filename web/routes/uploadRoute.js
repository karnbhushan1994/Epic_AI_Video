const express = require("express");
const multer = require("multer");
const { handleImage } = require("../utils/imageHandler");
const shopify = require("../shopify");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  shopify.validateAuthenticatedSession(), // Make sure session is valid
  upload.single("image"),                // Handle single file named "image"
  async (req, res) => {
    try {
      const filePath = req.file.path;
      const uploadedUrl = await handleImage(filePath);
      res.json({ url: uploadedUrl });
    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

module.exports = router;
