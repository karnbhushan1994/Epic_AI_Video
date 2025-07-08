// 📁 web/routes/appRoutes.js
import express from 'express';
import { verifyRequest } from '../middleware/verifyRequest.js';
import shopify from '../shopify.js';
import {freepikController } from '../controllers/app/freepikController.js'
const router = express.Router();
router.get('/generate-video', shopify.validateAuthenticatedSession(), freepikController);
router.post("/check-status/:taskId",shopify.validateAuthenticatedSession(),freepikController);

export default router;
