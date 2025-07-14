import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,          // ✅ FIXED
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // ✅ FIXED
  },
});


export const getPresignedUrl = async (req, res) => {
  try {
    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({ error: "Missing filename" });
    }

    const key = `uploads/${Date.now()}-${filename}`;
    const mimeType = getMimeType(filename.split(".").pop());

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.status(200).json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error("S3 Presigned URL Error:", error);
    res.status(500).json({ error: "Failed to get presigned URL" });
  }
};

function getMimeType(ext) {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
