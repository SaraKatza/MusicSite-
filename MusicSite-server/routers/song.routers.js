import express from "express";
import { addSong, getSong,getRecommendations, getSongsByCategory,updateSong, deleteSong,downloadSong, getSongsBySinger, getAllSongs } from "../controllers/song.controllers.js";
import { isAdmin, isSinger, isAdminOrSingerSelf, authenticateJWT } from "../middlewares/auth.middleware.js";
import { validateJoiSchema } from "../middlewares/validate.middleware.js";
import { songValidator } from "../models/song.models.js";
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from "path";


const __filename = fileURLToPath(import.meta.url);//כל הניתוב של איפה לשמור את התמונה
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });
const uploadFields = upload.fields([
    { name: 'urlSong', maxCount: 1 }, // השדה לשיר
    { name: 'urlImg', maxCount: 1 }       // השדה לתמונה
]);
const router = express.Router();

// ניתוב זה דורש התחברות (JWT)
router.get('/recommendations', authenticateJWT, getRecommendations);



// הוספת שיר חדש (זמר בלבד)
router.post("/",  isSinger,uploadFields, validateJoiSchema(songValidator.post), addSong);

// קבלת כל השירים
router.get("/", getAllSongs);

router.get("/by-category/:categoryId", getSongsByCategory);

// קבלת שיר לפי ID
router.get("/:id", getSong);

// עדכון שיר (מנהל או הזמר עצמו)
router.put("/:id", isAdminOrSingerSelf, uploadFields, validateJoiSchema(songValidator.put), updateSong);

// מחיקת שיר (מנהל או הזמר עצמו)
router.delete("/:id", isAdminOrSingerSelf, deleteSong);

router.get('/:id/download', downloadSong);



export default router;