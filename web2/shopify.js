// shopify.js
import { shopifyApp } from '@shopify/shopify-app-express';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';
import { restResources } from '@shopify/shopify-api/rest/admin/2025-04';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    hostName: process.env.HOST.replace(/^https?:\/\//, ''),
    scopes: process.env.SCOPES.split(','),
    apiVersion: '2025-04',
    restResources,
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: new MongoDBSessionStorage(MONGO_URI, 'shopify_sessions'),
});

export default shopify; // ✅ Export the full app
