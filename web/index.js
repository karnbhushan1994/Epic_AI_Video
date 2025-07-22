// @ts-check

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
import uploadRoutes from "./routes/uploadRoute.js";
import devRoutes from "./routes/devRoutes.js";
import freepikRoutes from "./routes/freepikRoutes.js";
import downloadRoutes from "./routes/download.js";

import { createOrUpdateAppInstall, markAppUninstalled } from "./controllers/app/appController.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./socketServer.js";
import verifyOAuthHmac from "./middleware/verifyOAuthHmac.js";
import cors from "cors";
import http from "http";

dotenv.config();

// ----------------------------
// Constants
// ----------------------------
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH = process.env.NODE_ENV === "production"
  ? `${process.cwd()}/frontend/dist`
  : `${process.cwd()}/frontend/`;

// ----------------------------
// App Initialization
// ----------------------------
await connectDB();

const app = express();
app.set("trust proxy", 1); // ✅ REQUIRED for proxy setups (Cloudflare, Render, Vercel)

// ----------------------------
// Middleware
// ----------------------------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------
// GDPR Webhooks
// ----------------------------
app.post("/webhooks/customers/data_request",
  express.raw({ type: "application/json" }),
  verifyOAuthHmac,
  (req, res) => {
    const payload = JSON.parse(req.body.toString("utf8"));
    console.log("📦 GDPR customers/data_request", payload);
    res.status(200).send("Data request handled");
  }
);

app.post("/webhooks/customers/redact",
  express.raw({ type: "application/json" }),
  verifyOAuthHmac,
  (req, res) => {
    const payload = JSON.parse(req.body.toString("utf8"));
    console.log("🗑 GDPR customers/redact", payload);
    res.status(200).send("Customer redact handled");
  }
);

app.post("/webhooks/shop/redact",
  express.raw({ type: "application/json" }),
  verifyOAuthHmac,
  (req, res) => {
    const payload = JSON.parse(req.body.toString("utf8"));
    console.log("🏪 GDPR shop/redact", payload);
    res.status(200).send("Shop redact handled");
  }
);

// ----------------------------
// Shopify Auth
// ----------------------------
app.get(shopify.config.auth.path, shopify.auth.begin());

app.get(shopify.config.auth.callbackPath,
  verifyOAuthHmac,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const session = res.locals.shopify.session;
      console.log("✅ Auth callback session:", session);

      if (!session) {
        console.error("❌ No session received from Shopify");
        return res.status(500).send("Session not created");
      }

      await createOrUpdateAppInstall(session);
      console.log("✅ App install saved");
    } catch (err) {
      console.error("❌ Error saving install info:", err.message);
    }
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);

// ----------------------------
// Webhook Endpoint
// ----------------------------
app.post(shopify.config.webhooks.path, shopify.processWebhooks({
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
}));

// ----------------------------
// App Routes
// ----------------------------
app.use("/api/v1/app", appRoutes);
app.use("/api/v1/app", adminRoutes);
app.use("/api/v1/app", uploadRoutes);// for s3Bucket
app.use("/api/v1/app/freepik", freepikRoutes);
app.use("/api/v1/app", downloadRoutes);

if (process.env.NODE_ENV === "development") {
  app.use("/api/dev", devRoutes);
}

// ----------------------------
// Static + Frontend
// ----------------------------
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

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
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
