import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import { User } from "../models/user.models.js";

// פונקציית עזר לבדיקת תקינות ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// תוקף טוקן ברירת מחדל: שבוע (ניתן לשנות דרך משתנה סביבה JWT_EXPIRES)
const TOKEN_EXPIRES = process.env.JWT_EXPIRES || '1w';

const router = express.Router();

// ------------------------------------------------------------------
// שליפת כל המשתמשים (עם אפשרות לסינון לפי תפקיד)
// ------------------------------------------------------------------
export async function getAllUsers(req, res, next) {
    try {
        let users;
        // בדיקה אם קיים פרמטר role ב-query
        if (req.query.role) {
            users = await User.find({ role: req.query.role });
        } else {
            users = await User.find();
        }

        if (!users.length) {
            return next({ message: 'No users found', status: 204 });
        }
        res.json(users);
    } catch (err) {
        return next({ message: `Server error: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// שליפת משתמש ספציפי לפי ID
// ------------------------------------------------------------------
export async function getUser(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return next({ message: 'Invalid user id', status: 400 });

        const user = await User.findById(req.params.id);

        if (!user) {
            return next({ message: 'User not found', status: 404 });
        }
        res.json(user);
    } catch (err) {
        return next({ message: `Server error: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// עדכון משתמש (חלקי או מלא) - כולל טיפול בעדכון תמונה
// ------------------------------------------------------------------
export async function updateUser(req, res, next) {
    try {
        const updateData = req.body;
        
        // ** חדש: טיפול בקובץ התמונה שהועלה (אם קיים) **
        if (req.file) {
            const imgPath = `/uploads/${req.file.filename}`;
            updateData.img = imgPath;
        }

        // בקרת חובת תמונה לזמר
        if (updateData.role === 'singer' && !updateData.img) {
             if (!req.file && (!updateData.img || updateData.img === '')) {
                 const existingUser = await User.findById(req.params.id);
                 if (existingUser && existingUser.role === 'singer' && !existingUser.img) {
                      return next({ message: 'Image is required for singers', status: 400 });
                 }
                 if (updateData.role === 'singer' && !existingUser.img) {
                      return next({ message: 'Image is required for singers when updating role', status: 400 });
                 }
             }

        }
        
        if (!isValidId(req.params.id)) return next({ message: 'Invalid user id', status: 400 });

        // עדכון המסמך
        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true, // מחזיר את המסמך המעודכן
            runValidators: true, // מפעיל את ולידציית הסכמה לפני העדכון (חשוב להצפנת סיסמה)
        });

        if (!user) {
            return next({ message: 'User not found', status: 404 });
        }
        
        res.json(user); // מחזיר את אובייקט המשתמש המעודכן, כולל נתיב התמונה החדש
    } catch (err) {
        return next({ message: `Failed to update user: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// יצירת משתמש חדש (רישום)
// ------------------------------------------------------------------
export async function register(req, res, next) {
    try {
        const userData = req.body;
        
        // בדיקה אם הוא זמר אז אם הוא קיבל תמונה
        if (req.body.role === 'singer' && !req.file) {
            return next({ message: 'Image is required for singers', status: 400 });
        }

        // שמירת נתיב התמונה
        if (req.file) {
            const imgPath = `/uploads/${req.file.filename}`;
            userData.img = imgPath;
        }

        // בדיקה אם המייל קיים כבר
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return next({ message: 'Email already exists', status: 400 });
        }

        // יצירת משתמש חדש
        const user = new User(userData);

        // יצירת טוקן JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES } // ברירת מחדל: שבוע
        );

        await user.save();

        // החזרת התגובה עם פרטי המשתמש והטוקן
        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                img: user.img, // התמונה מוחזרת
            },
            token,
        });
    } catch (err) {
        return next({ message: `Failed to register user: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// התחברות משתמש
// ------------------------------------------------------------------
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        // בדיקה אם המשתמש קיים
        if (!user) {
            return next({ message: 'Invalid email or password', status: 401 });
        }

        // השוואת סיסמה
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // הודעה כללית כדי לא לחשוף אם הבעיה היא במייל או בסיסמה
            return next({ message: 'Invalid email or password', status: 401 });
        }

        // יצירת טוקן JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES } // ברירת מחדל: שבוע
        );

        // החזרת התגובה
        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                img: user.img, // התמונה מוחזרת בתגובת ה-login
            },
            token,
        });
    } catch (err) {
        return next({ message: `Failed to login: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// מחיקת משתמש לפי ID (מיועד למנהל)
// ------------------------------------------------------------------
export async function deleteUser(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return next({ message: 'Invalid user id', status: 400 });

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return next({ message: 'User not found', status: 404 });
        }
        // קוד 204 No Content - הצלחה ללא גוף תגובה
        res.status(204).send();
    } catch (err) {
        return next({ message: `Server error: ${err.message}`, status: 500 });
    }
}