import express from "express";
import { getPresignedUrl } from "../controllers/app/s3Controller.js";
import shopify from '../shopify.js';

const router = express.Router();

router.get("/s3-presigned-url", shopify.validateAuthenticatedSession(), getPresignedUrl);

export default router;
