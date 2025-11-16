import express from "express";
import { addFavorite, removeFavorite, getFavoritesByUser } from "../controllers/favorite.controllers.js";
import { isSelf ,authenticateJWT} from "../middlewares/auth.middleware.js";
import { validateJoiSchema } from "../middlewares/validate.middleware.js";
import { favoriteValidator } from "../models/favorite.models.js";


const router = express.Router();

// הוספת פריט למועדפים (משתמש מזוהה)
router.post("/", isSelf, validateJoiSchema(favoriteValidator), addFavorite);

// מחיקת פריט מהמועדפים (משתמש מזוהה)
router.delete("/:id",authenticateJWT, removeFavorite);

// קבלת כל המועדפים של המשתמש המחובר
router.get("/", authenticateJWT, getFavoritesByUser);
export default router;