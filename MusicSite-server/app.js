import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import dbConnect from './config/db.js';
import { urlNotFound, errorHandler } from './middlewares/errors.middleware.js';
import { authenticateJWT } from './middlewares/auth.middleware.js';

// Import routers
import categoryRouter from './routers/category.router.js';
import songRouter from './routers/song.routers.js';
import userRouter from './routers/user.routers.js';
import favoriteRouter from './routers/favorite.routers.js';

const app = express();
const PORT = process.env.PORT || 3000;

// הגדרת __filename ו-__dirname לסביבת ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
dbConnect();

// Middlewares כלליים
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. נתיבים ציבוריים (אינם דורשים אימות) ---

// נתיב משתמשים: רישום (/api/users/) והתחברות (/api/users/login) חייבים להיות כאן
app.use('/api/users', userRouter); // *** הועבר למיקום זה כדי לעבוד ללא JWT ***
app.use('/api/categories', categoryRouter);
app.use('/api/songs', songRouter);
app.use('/api/favorites', favoriteRouter);

// Static File Serving (חשיפת תיקיית public)
app.use(express.static(path.join(__dirname, 'public')));


// --- 2. מחסום האימות (JWT) ---
app.use(authenticateJWT); // Apply JWT authentication middleware globally
// מעתה והלאה, כל נתיב מחייב טוקן תקין ב-Header


// --- 3. נתיבים מוגנים (דורשים אימות) ---


// Health check route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Music API is running!',
        version: '1.0.0',
        endpoints: {
            categories: '/api/categories',
            songs: '/api/songs',
            users: '/api/users',
            favorites: '/api/favorites',
        },
    });
});

// Error handling middlewares
app.use(urlNotFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;