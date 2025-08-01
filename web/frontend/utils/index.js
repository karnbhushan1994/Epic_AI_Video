// @ts-check

// ----------------------------
// Imports & Configuration
// ----------------------------
import express from "express";
import serveStatic from "serve-static";
import { join } from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { DeliveryMethod } from "@shopify/shopify-api";

import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import appRoutes from "./routes/appRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes  from "./routes/uploadRoute.js";
import devRoutes from "./routes/devRoutes.js";
import { createOrUpdateAppInstall, markAppUninstalled } from "./controllers/app/appController.js";
//import webhookRoutes  from './routes/webhooks.js';
import { connectDB } from './config/db.js';
import cors from 'cors';
import http from 'http';
import { initializeSocket } from './socketServer.js';
import freepikRoutes from "./routes/freepikRoutes.js";
import verifyOAuthHmac from "./middleware/verifyOAuthHmac.js";

dotenv.config();

// ----------------------------
// Constants
// ----------------------------
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

// ----------------------------
// App Initialization
// ----------------------------
await connectDB();

const app = express();
// app.use('/webhooks/shopify', express.raw({ type: 'application/json' }));

// app.use("/webhooks",webhookRoutes)
// app.use(express.json()); // Parse JSON bodies
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
// }))
// ----------------------------
// Shopify Auth Routes
// ----------------------------
app.get(shopify.config.auth.path, shopify.auth.begin());

app.get(
  shopify.config.auth.callbackPath,
  verifyOAuthHmac,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const session = res.locals.shopify.session;
      await createOrUpdateAppInstall(session); // Save install data
    } catch (err) {
      console.error("Error saving install info:", err.message);
    }
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);

// ----------------------------
// Webhooks Handling
// ----------------------------
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({
    webhookHandlers: {
      ...PrivacyWebhookHandlers,
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (_topic, shop) => {
          console.log("App uninstalled:", shop);
          await markAppUninstalled(shop);
        },
      },
    },
  })
);


// ----------------------------
// API Routes
// ----------------------------
app.use("/api/v1/app", appRoutes);
app.use("/api/v1/app", adminRoutes);
app.use("/api/v1/app",uploadRoutes); // Prefix route

app.use("/api/v1/app/freepik",freepikRoutes);

if (process.env.NODE_ENV === "development") {
  app.use("/api/dev", devRoutes); // Dev-only routes (no auth)
}

// Example backend implementation
// app.post('/api/v1/app/freepik/remove-background', async (req, res) => {
//   try {
//     const { image_url } = req.body;
    
//     const response = await fetch('https://api.freepik.com/v1/ai/beta/remove-background', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'x-freepik-api-key': process.env.FREEPIK_API_KEY
//       },
//       body: new URLSearchParams({
//         image_url: image_url
//       })
//     });
    
//     const result = await response.json();
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });
// ----------------------------
// Static Assets & Frontend
// ----------------------------
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

// Frontend fallback (SPA entry point)
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  const html = readFileSync(join(STATIC_PATH, "index.html"))
    .toString()
    .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "");

  res.status(200).set("Content-Type", "text/html").send(html);
});

// ----------------------------
// Start Server
// ----------------------------
const server = http.createServer(app);
initializeSocket(server); // Attach Socket.IO

server.listen(PORT, () => {
  console.log(`Server + Socket running at http://localhost:${PORT}`);
});