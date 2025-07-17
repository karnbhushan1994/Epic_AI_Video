import express from "express";
import serveStatic from "serve-static";
import { join } from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { DeliveryMethod } from "@shopify/shopify-api";
import http from "http";
import cors from "cors";

// Core
import shopify from "./shopify.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./socketServer.js";

// Routes
import appRoutes from "./routes/appRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import freepikRoutes from "./routes/freepikRoutes.js";

// Controllers
import {
  createOrUpdateAppInstall,
  markAppUninstalled,
} from "./controllers/app/appController.js";

// Middleware
import verifyOAuthHmac from "./middleware/verifyOAuthHmac.js";

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

await connectDB();

const app = express();
const server = http.createServer(app);

// ---------- CORS ----------
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ---------- JSON Parser ----------
app.use(express.json());

// ---------- Shopify Auth ----------
app.get(shopify.config.auth.path, shopify.auth.begin());

app.get(
  shopify.config.auth.callbackPath,
  verifyOAuthHmac,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const session = res.locals.shopify.session;
      await createOrUpdateAppInstall(session);
    } catch (err) {
      console.error("⚠️ Install save error:", err.message);
    }
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);

// ---------- Shopify Webhooks ----------
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({
    webhookHandlers: {
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/app-uninstalled",
        callback: async (_topic, shop) => {
          try {
            console.log("🔌 App uninstalled:", shop);
            await markAppUninstalled(shop); // Your existing logic
          } catch (err) {
            console.error("❌ Error handling APP_UNINSTALLED:", err.message);
          }
        },
      },

      CUSTOMERS_DATA_REQUEST: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/customers/data_request",
        callback: async (_topic, shop, body) => {
          try {
            const payload = JSON.parse(body);
            console.log("📦 GDPR data request from:", shop);
            console.log(payload);
            // Handle or store the request as needed
          } catch (err) {
            console.error("❌ Error handling CUSTOMERS_DATA_REQUEST:", err.message);
          }
        },
      },

      CUSTOMERS_REDACT: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/customers/redact",
        callback: async (_topic, shop, body) => {
          try {
            const payload = JSON.parse(body);
            console.log("🗑 GDPR customer redact from:", shop);
            console.log(payload);
            // Handle customer data deletion logic
          } catch (err) {
            console.error("❌ Error handling CUSTOMERS_REDACT:", err.message);
          }
        },
      },

      SHOP_REDACT: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/webhooks/shop/redact",
        callback: async (_topic, shop, body) => {
          try {
            const payload = JSON.parse(body);
            console.log("🏪 GDPR shop redact from:", shop);
            console.log(payload);
            // Handle shop data deletion logic
          } catch (err) {
            console.error("❌ Error handling SHOP_REDACT:", err.message);
          }
        },
      },
    },
  })
);


// ---------- API Routes ----------
app.use("/api/v1/app", appRoutes);
app.use("/api/v1/app", adminRoutes);
app.use("/api/v1/app", uploadRoutes);
app.use("/api/v1/app/freepik", freepikRoutes);

if (process.env.NODE_ENV === "development") {
  app.use("/api/dev", devRoutes);
}

// ---------- Static Frontend ----------
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  const html = readFileSync(join(STATIC_PATH, "index.html")).toString();
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(html.replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || ""));
});

// ---------- Start Server ----------
initializeSocket(server);
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running at http://localhost:${PORT}`);
});
