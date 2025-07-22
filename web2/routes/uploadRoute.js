import express from 'express';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import shopify from '../shopify.js';

const router = express.Router();

// Create S3 client using EC2 IAM role
const s3 = new S3Client({ region: 'us-east-1' });

// Use memory storage (file stored in RAM temporarily)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/v1/app/upload
router.post(
  '/upload',
  shopify.validateAuthenticatedSession(),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { buffer, originalname, mimetype } = req.file;
      const filename = `uploads/${Date.now()}-${originalname}`;

      // Upload using lib-storage
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: 'epicappaivideos',
          Key: filename,
          Body: buffer,
          ContentType: mimetype,
         // ACL: 'public-read',
        },
      });

      const result = await upload.done();

      const fileUrl = `https://${result.Bucket}.s3.${s3.config.region}.amazonaws.com/${result.Key}`;
      console.log('✅ Upload successful:', fileUrl);

      res.status(200).json({ fileUrl });
    } catch (error) {
      console.error('❌ Upload failed:', error);
      res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  }
);

export default router;
