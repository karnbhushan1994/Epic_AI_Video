import { DeliveryMethod } from "@shopify/shopify-api";

const PrivacyWebhookHandlers = {
  CUSTOMERS_DATA_REQUEST: {
    topic: "CUSTOMERS_DATA_REQUEST",
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks/customers/data_request",
    callback: async (_topic, shop, body) => {
      const payload = JSON.parse(body);
      console.log("📦 GDPR CUSTOMERS_DATA_REQUEST from:", shop);
      console.dir(payload, { depth: null });

      // TODO: Return or store customer data
    },
  },

  CUSTOMERS_REDACT: {
    topic: "CUSTOMERS_REDACT",
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks/customers/redact",
    callback: async (_topic, shop, body) => {
      const payload = JSON.parse(body);
      console.log("🗑️ GDPR CUSTOMERS_REDACT from:", shop);
      console.dir(payload, { depth: null });

      // TODO: Anonymize or delete customer data
    },
  },

  SHOP_REDACT: {
    topic: "SHOP_REDACT",
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks/shop/redact",
    callback: async (_topic, shop, body) => {
      const payload = JSON.parse(body);
      console.log("🏪 GDPR SHOP_REDACT from:", shop);
      console.dir(payload, { depth: null });

      // TODO: Delete or anonymize all shop data after uninstall
    },
  },
};

export default PrivacyWebhookHandlers;
