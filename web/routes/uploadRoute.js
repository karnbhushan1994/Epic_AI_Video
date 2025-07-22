import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { fromInstanceMetadata } from '@aws-sdk/credential-provider-imds';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router();

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: fromInstanceMetadata({
    timeout: 1000,
    maxRetries: 3,
  }),
});

const uploadMiddleware = multer({ storage: multer.memoryStorage() });

/**
 * 📤 Route 1: Upload Local File to S3
 */
router.post('/upload', uploadMiddleware.single('file'), async (req, res) => {
  try {
    console.log('🔍 Verifying AWS identity...');
    const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
    const stsClient = new STSClient({
      region: 'us-east-1',
      credentials: fromInstanceMetadata(),
    });
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('✅ AWS Identity:', identity);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, originalname, mimetype } = req.file;
    console.log('📦 Uploading local file with MIME type:', mimetype);

    const extension = originalname.split('.').pop();
    const prefix = mimetype.startsWith('video/')
      ? 'video'
      : mimetype.startsWith('image/')
      ? 'image'
      : 'file';

    const filename = `uploads/${prefix}-${Date.now()}-${originalname}`;

    const params = {
      Bucket: 'epicappaivideos',
      Key: filename,
      Body: buffer,
      ContentType: mimetype,
    };

    const s3Upload = new Upload({ client: s3, params });
    await s3Upload.done();

    const fileUrl = `https://${params.Bucket}.s3.us-east-1.amazonaws.com/${params.Key}`;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

/**
 * 🌐 Route 2: Upload Image or Video from Remote URL to S3
 */
router.post('/upload-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    console.log('🌐 Downloading file from URL using fetch:', imageUrl);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    if (contentLength > MAX_SIZE) {
      return res.status(413).json({ error: 'File too large' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use file-type for accurate MIME detection
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !/^image\/|^video\//.test(type.mime)) {
      return res.status(415).json({ error: `Unsupported or unrecognized file type` });
    }

    console.log('📦 Remote file verified MIME type:', type.mime);

    const prefix = type.mime.startsWith('video/') ? 'remote-video' : 'remote-image';
    const extension = type.ext || 'bin';
    const filename = `uploads/${prefix}-${Date.now()}.${extension}`;

    const params = {
      Bucket: 'epicappaivideos',
      Key: filename,
      Body: buffer,
      ContentType: type.mime,
    };

    const s3Upload = new Upload({ client: s3, params });
    await s3Upload.done();

    const fileUrl = `https://${params.Bucket}.s3.us-east-1.amazonaws.com/${params.Key}`;
    console.log('✅ Remote file uploaded:', fileUrl);

    res.status(200).json({
      fileUrl,
      contentType: type.mime,
      size: buffer.length,
      key: filename,
    });
  } catch (error) {
    console.error('❌ Upload from URL failed:', error.message);
    res.status(500).json({ error: 'Upload from URL failed: ' + error.message });
  }
});

export default router;
