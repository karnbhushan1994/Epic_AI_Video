// 📁 web/routes/appRoutes.js
import express from 'express';
import { verifyRequest } from '../middleware/verifyRequest.js';
import shopify from '../shopify.js';
import {generateVideo,checkStatus} from '../controllers/app/freepikController.js'
const router = express.Router();
router.get('/generate-video', shopify.validateAuthenticatedSession(), generateVideo);
router.post("/check-status/:taskId",shopify.validateAuthenticatedSession(),checkStatus);

export default router;
