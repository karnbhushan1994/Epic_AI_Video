// middleware/verifyShopifyHmac.js
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export default function verifyShopifyHmac(req, res, next) {
  const { hmac, ...params } = req.query;

  if (!hmac) {
    return res.status(400).send('Missing HMAC');
  }

  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    console.error('❌ SHOPIFY_API_SECRET is not set');
    return res.status(500).send('Server configuration error');
  }

  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const generatedHash = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmac));
    if (!isValid) {
      return res.status(400).send('Invalid HMAC – Request not trusted');
    }
    next();
  } catch (err) {
    return res.status(400).send('HMAC validation error');
  }
}
