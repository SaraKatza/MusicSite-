import express from "express";
import { addFavorite, removeFavorite, getFavoritesByUser } from "../controllers/favorite.controllers.js";
import { isSelf } from "../middlewares/auth.middleware.js";
import { validateJoiSchema } from "../middlewares/validate.middleware.js";
import { favoriteValidator } from "../models/favorite.models.js";


const router = express.Router();

// הוספת פריט למועדפים (משתמש מזוהה)
router.post("/", isSelf, validateJoiSchema(favoriteValidator), addFavorite);

// מחיקת פריט מהמועדפים (משתמש מזוהה)
router.delete("/:id", isSelf, removeFavorite);

// קבלת כל המועדפים של המשתמש המחובר
router.get("/", isSelf, getFavoritesByUser);

export default router;