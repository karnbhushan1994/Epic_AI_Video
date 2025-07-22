import crypto from "crypto";

export default function verifyOAuthHmac(req, res, next) {
  const { hmac, ...params } = req.query;
  if (!hmac) return res.status(400).send("Missing HMAC");

  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const hash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  if (hash === hmac) {
    return next();
  } else {
    return res.status(403).send("Invalid HMAC");
  }
}
