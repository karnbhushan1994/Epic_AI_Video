// 📁 web/routes/appRoutes.js
import express from 'express';
import { createCategory } from '../controllers/app/categoryController.js';

const router = express.Router();
// later i will use jwt 
//router.post('/categories',createCategory);

export default router;
