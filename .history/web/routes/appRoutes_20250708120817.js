// 📁 web/routes/appRoutes.js
import express from 'express';
import { listCategories , createCategory } from '../controllers/app/categoryController.js';
import { verifyRequest } from '../middleware/verifyRequest.js';
import shopify from '../shopify.js';
import { templateCreations, updateCreation } from '../controllers/app/creationsController.js';
import {currentMerchantTotalCreations} from '../controllers/app/dashboardController.js'
import { fetchProduct } from '../controllers/app/productController.js';
import { generateVideo } from '../controllers/app/videoController.js';
//import {fetchProduct} from '../controllers/app/productController.js'
const router = express.Router();

router.get('/dashboard', verifyRequest(shopify), async (req, res) => {
  const shop = req.query.shop || req.get('X-Shopify-Shop');
  const accessToken = req.get('X-Shopify-Access-Token');

  // Ensure that 'shop' and 'accessToken' are provided
  if (!shop || !accessToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing shop or access token',
    });
  }

  try {
    const { Shop } = shopify.api.rest;  // Assuming Shopify REST API is configured

    // Make API call to fetch shop details
    const response = await Shop.all({ session: { shop, accessToken } });

    res.status(200).json({
      success: true,
      shop: response.data[0],  // Returning the first shop data object
    });
  } catch (error) {
    const message = error?.response?.body?.errors || error.message;
    res.status(error?.response?.code || 500).json({
      success: false,
      error: message,
    });
  }
});

//list  all categories 
//router.get('/list-categories', verifyRequest(shopify), listCategories);
router.get('/list-categories', shopify.validateAuthenticatedSession(), listCategories);
//routes
router.post('/creations', shopify.validateAuthenticatedSession(), templateCreations);
router.put('/creations/:id', shopify.validateAuthenticatedSession(), updateCreation);
router.get('/current-merchant-total-creations', shopify.validateAuthenticatedSession(), currentMerchantTotalCreations);
//router.get('/current-merchant-total-creations', shopify.validateAuthenticatedSession(), fetchStorefrontProduct);
router.get('/fetch-product', shopify.validateAuthenticatedSession(), fetchProduct);
router.post("/generate-video",shopify.validateAuthenticatedSession(),generateVideo);

export default router;
