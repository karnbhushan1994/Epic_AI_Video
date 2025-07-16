// middleware/verifyWebhookHmac.js
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export default function verifyWebhookHmac(req, res, next) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const secret = process.env.SHOPIFY_API_SECRET;
  
  if (!hmacHeader || !req.body || !secret) {
    console.error("❌ Missing HMAC, body, or secret");
    return res.status(401).send("Unauthorized");
  }
  
  try {
    // Generate hash from raw body
    const generatedHash = crypto
      .createHmac("sha256", secret)
      .update(req.body, "utf8")
      .digest("base64");
    
    // Debug logging
    console.log("🔍 HMAC Debug Info:");
    console.log("Header HMAC:", hmacHeader);
    console.log("Generated HMAC:", generatedHash);
    console.log("Header length:", hmacHeader.length);
    console.log("Generated length:", generatedHash.length);
    
    // Direct string comparison for base64 values
    const isValid = hmacHeader === generatedHash;
    
    if (!isValid) {
      console.error("❌ Invalid HMAC - Hash mismatch");
      return res.status(401).send("Unauthorized");
    }
    
    console.log("✅ HMAC verification successful");
    next();
    
  } catch (error) {
    console.error("❌ HMAC verification error:", error.message);
    return res.status(401).send("Unauthorized");
  }
}