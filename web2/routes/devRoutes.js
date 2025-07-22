import express from "express";
import shopify from "../shopify.js";

const router = express.Router();

router.get("/shop-data", async (req, res) => {
  const shop = req.query.shop || req.get("X-Shopify-Shop");
  const accessToken = req.get("X-Shopify-Access-Token");

  if (!shop || !accessToken) {
    return res.status(400).json({
      success: false,
      error: "Missing shop or access token",
    });
  }

  try {
    const { Shop } = shopify.api.rest;
    const response = await Shop.all({ session: { shop, accessToken } });

    res.status(200).json({ success: true, shop: response.data[0] });
  } catch (error) {
    const message = error?.response?.body?.errors || error.message;
    res.status(error?.response?.code || 500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
