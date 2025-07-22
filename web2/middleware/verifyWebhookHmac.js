// middleware/verifyWebhookHmac.js

import crypto from 'crypto'; // Node.js module to create cryptographic hashes
import dotenv from 'dotenv'; // Module to load environment variables from .env file

dotenv.config(); // Load environment variables

// Middleware function to verify Shopify webhook HMAC
export default function verifyWebhookHmac(req, res, next) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256']; // Get the HMAC from Shopify webhook headers

  // If HMAC header is missing or not a string, return an error
  if (!hmacHeader || typeof hmacHeader !== 'string') {
    return res.status(400).json({ error: 'Missing or malformed HMAC header' });
  }

  const apiSecret = process.env.SHOPIFY_API_SECRET; // Get your Shopify API secret from env variables

  // If the secret is not set in environment, return an error
  if (!apiSecret) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const rawBody = req.body; // The raw body is needed to generate the correct HMAC

  // Make sure the body is a Buffer (not parsed into JSON yet)
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: 'Invalid request body format. Must be a raw buffer.' });
  }

  try {
    // Create HMAC using SHA-256 with your secret and the raw body
    const generatedHmac = crypto
      .createHmac('sha256', apiSecret) // Use secret to create HMAC
      .update(rawBody) // Input the raw body
      .digest('base64'); // Output it in base64 format

    // Convert both HMACs to buffers for secure comparison
    const receivedHmac = Buffer.from(hmacHeader, 'utf-8'); // From Shopify
    const expectedHmac = Buffer.from(generatedHmac, 'utf-8'); // What you generated

    // Check if the lengths match and values match using a safe comparison
    const isValid =
      receivedHmac.length === expectedHmac.length &&
      crypto.timingSafeEqual(receivedHmac, expectedHmac); // Safe compare

    // If HMACs do not match, respond with an error
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook HMAC' });
    }

    next(); // If valid, move to the next middleware or route
  } catch (error) {
    // If there's any error during HMAC checking, respond with server error
    return res.status(500).json({ error: 'Internal server error during HMAC verification' });
  }
}
