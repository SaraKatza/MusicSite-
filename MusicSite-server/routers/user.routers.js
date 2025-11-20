import express, { Router } from "express";
import { getAllUsers, getUser, updateUser, deleteUser, register, login } from "../controllers/user.controllers.js";
import { isAdmin, isSelf, authenticateJWT } from "../middlewares/auth.middleware.js";
import { validateJoiSchema } from "../middlewares/validate.middleware.js";
import { userValidator } from "../models/user.models.js";
import { isAdminOrSelf } from "../middlewares/auth.middleware.js";
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
const router = express.Router();       // מידלוואר לבדיקת הרשאות: מנהל או המשתמש עצמו


// שליפת כל המשתמשים
router.get('/', getAllUsers);

// יצירת משתמש חדש (רישום)
// נתיב ציבורי לרישום רגיל (ללא role של admin/singer)
router.post('/register', upload.single("img"), validateJoiSchema(userValidator.register), register);
// נתיב מיוחד: מנהל יוצר מנהל חדש (מאפשר role: admin)
router.post('/create-admin', 
    authenticateJWT, 
    isAdmin, 
    upload.single("img"), 
    validateJoiSchema(userValidator.register), 
    register
);

// נתיב מוגן ליצירת משתמשים על ידי מנהל (מאפשר admin/singer)
router.post('/create-by-admin', authenticateJWT, isAdmin, upload.single("img"), validateJoiSchema(userValidator.register), register);
// התחברות משתמש
router.post('/login', validateJoiSchema(userValidator.login), login);

// שליפת משתמש לפי ID
router.get('/:id', isAdminOrSelf, getUser);

// עדכון משתמש לפי ID
router.put('/:id', upload.single("img"),  validateJoiSchema(userValidator.put), updateUser);

// מחיקת משתמש לפי ID (מנהל בלבד)
router.delete('/:id', isAdmin, deleteUser);
export default router;
