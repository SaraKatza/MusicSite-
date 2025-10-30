import express from "express";
import { addCategory, getCategory, getAllCategories, updateCategory, deleteCategory } from "../controllers/category.controllers.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import { validateJoiSchema } from "../middlewares/validate.middleware.js";
import { categoryValidator } from "../models/category.models.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/', isAdmin, validateJoiSchema(categoryValidator), addCategory);
router.get('/',  getAllCategories);
router.get('/:id', getCategory);
router.put('/:id', isAdmin, validateJoiSchema(categoryValidator), updateCategory);
router.delete('/:id', isAdmin, deleteCategory);

export default router;