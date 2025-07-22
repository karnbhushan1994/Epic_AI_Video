const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const mime = require("mime-types");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Upload file to S3
const uploadToS3 = async (filePath, s3FileName) => {
  try {
    const fileContent = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${s3FileName}`,
      Body: fileContent,
      ContentType: contentType,
      ACL: "public-read",
    };

    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (err) {
    console.error("❌ S3 Upload Failed:", err);
    throw new Error("Failed to upload image to S3");
  }
};

// Main function: handles both URLs and local paths
const handleImage = async (inputPathOrUrl) => {
  const isUrl = inputPathOrUrl.startsWith("http");

  if (isUrl) {
    // Handle remote image
    try {
      const response = await fetch(inputPathOrUrl);
      if (!response.ok) throw new Error("Failed to download image from URL");

      const buffer = await response.buffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const ext = mime.extension(contentType) || "jpg";
      const tempFile = path.join(__dirname, `temp-${uuidv4()}.${ext}`);

      await fs.writeFile(tempFile, buffer);
      const s3Url = await uploadToS3(tempFile, `remote-${uuidv4()}.${ext}`);
      await fs.remove(tempFile);

      return s3Url;
    } catch (err) {
      console.error("❌ Failed to handle remote image:", err);
      throw err;
    }
  } else {
    // Handle local file
    try {
      const fileName = path.basename(inputPathOrUrl);
      const s3FileName = `local-${uuidv4()}-${fileName}`;
      return await uploadToS3(inputPathOrUrl, s3FileName);
    } catch (err) {
      console.error("❌ Failed to handle local image:", err);
      throw err;
    }
  }
};

module.exports = { handleImage };
