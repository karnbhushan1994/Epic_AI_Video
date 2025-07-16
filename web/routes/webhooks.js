// routes/webhooks.js
import express from 'express';
import verifyWebhookHmac from '../middleware/verifyWebhookHmac.js';
import { AppInstallation } from '../models/AppInstallation.js';

const router = express.Router();

// Apply raw body middleware specifically to this route
router.post('/shopify', 
  express.raw({ type: 'application/json' }), // This ensures req.body is a Buffer
  verifyWebhookHmac, 
  async (req, res) => {
    try {
      const topic = req.get('X-Shopify-Topic');
      const payload = JSON.parse(req.body.toString('utf8')); // Raw buffer to JSON

      switch (topic) {
        case 'shop/redact':
          console.log('Shop Redact:', payload.shop_domain);
          await AppInstallation.findOneAndDelete({ shop: payload.shop_domain });
          break;

        case 'customers/redact':
          console.log('Customer Redact:', payload.customer?.email);
          break;

        case 'customers/data_request':
          console.log('Customer Data Request:', payload.customer?.email);
          break;

        default:
          console.warn('Unhandled webhook topic:', topic);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('❌ Webhook error:', err);
      res.sendStatus(500);
    }
  }
);

export default router;