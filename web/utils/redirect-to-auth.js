// Import the Shopify API constructor and the latest API version from the Shopify package
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

// Initialize the Shopify API client with necessary configuration
const shopify = shopifyApi({
  // API key of the Shopify app (stored in environment variable for security)
  apiKey: process.env.SHOPIFY_API_KEY,

  // API secret key of the Shopify app (also from environment variable)
  apiSecretKey: process.env.SHOPIFY_API_SECRET,

  // OAuth scopes required by the app, split into an array (e.g. "read_orders,write_products")
  scopes: process.env.SCOPES.split(','),

  // Hostname of the app, stripped of the "http://" or "https://" prefix
  hostName: process.env.SHOPIFY_APP_URL.replace(/https?:\/\//, ''),

  // The API version to use — always set to the latest version to ensure up-to-date compatibility
  apiVersion: LATEST_API_VERSION,
});

// Exported async function to handle redirection to Shopify OAuth flow
export default async function redirectToAuth(req, res, app) {
  // If no shop query param is provided in the request, return a 500 error
  if (!req.query.shop) {
    res.status(500);
    return res.send("No shop provided");
  }

  // If the app is embedded in the Shopify Admin (i.e. running inside an iframe)
  if (req.query.embedded === "1") {
    // Use client-side redirection to break out of the iframe and start OAuth
    return clientSideRedirect(req, res);
  }

  // Otherwise, use server-side redirection to begin the OAuth process
  return await serverSideRedirect(req, res, app);
}

// Handles redirection for embedded apps (client-side redirect using Shopify's `exitiframe` strategy)
function clientSideRedirect(req, res) {
  // Sanitize the shop domain (to ensure it’s a valid `.myshopify.com` format)
  const shop = shopify.utils.sanitizeShop(req.query.shop);

  // Construct the redirect URI that will be used once the iframe is exited
  const redirectUriParams = new URLSearchParams({
    shop,
    host: req.query.host, // Host param is required by Shopify to load the app in Admin
  }).toString();

  // Add necessary query params to redirect to our auth endpoint after breaking out of iframe
  const queryParams = new URLSearchParams({
    ...req.query, // Include all original query params
    shop,
    redirectUri: `https://${shopify.config.hostName}/api/auth?${redirectUriParams}`, // Where to go after iframe exit
  }).toString();

  // Redirect the browser to the `/exitiframe` route which will handle iframe exit and redirection
  return res.redirect(`/exitiframe?${queryParams}`);
}

// Handles server-side OAuth redirection (for non-embedded apps or post-iframe redirect)
async function serverSideRedirect(req, res, app) {
  // Begin the OAuth flow with Shopify, specifying the shop and callback path
  const redirectUrl = await shopify.auth.begin({
    shop: req.query.shop, // The shop initiating the OAuth flow
    callbackPath: "/api/auth/callback", // Where Shopify will redirect after authorization
    isOnline: app.get("use-online-tokens") // Determines if tokens are online (per-user) or offline (app-wide)
  });

  // Redirect the user to Shopify's authorization screen
  return res.redirect(redirectUrl);
}
