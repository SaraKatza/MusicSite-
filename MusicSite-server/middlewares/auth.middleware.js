import jwt from 'jsonwebtoken';
import { Song } from '../models/song.models.js';

export function isAdmin(req, res, next) {
    authenticateJWT(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            return next();
        }
        return res.status(403).json({ error: 'גישה אסורה - מנהל בלבד' });
    });
}

export function isSelf(req, res, next) {
    authenticateJWT(req, res, () => {
        if (req.user && req.user._id.toString() === req.params.id) {
            return next();
        }
        return res.status(403).json({ error: 'גישה אסורה - רק המשתמש עצמו יכול לעדכן' });
    });
}

export function isSinger(req, res, next) {
    authenticateJWT(req, res, () => {
        if (req.user && req.user.role === 'singer') {
            return next();
        }
        return res.status(403).json({ error: 'גישה אסורה - זמר בלבד' });
    });
}


export function isAdminOrSelf(req, res, next) {
    authenticateJWT(req, res, () => {
        if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
            return next();
        }
        return res.status(403).json({ error: 'גישה אסורה - מנהל או המשתמש עצמו בלבד' });
    });     
}


    export function isAdminOrSingerSelf(req, res, next) {
    authenticateJWT(req, res, async () => {
        try {
            const song = await Song.findById(req.params.id);
            if (!song) {
                return res.status(404).json({ error: 'השיר לא נמצא' });
            }

            if (req.user.role === 'admin' || (req.user.role === 'singer' && song.idSinger.toString() === req.user._id.toString())) {
                return next();
            }
            
            return res.status(403).json({ error: 'גישה אסורה - מנהל או הזמר שיצר את השיר בלבד' });
        } catch (err) {
            return res.status(500).json({ error: 'שגיאה בבדיקת הרשאות' });
        }
    });
}

export function authenticateJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'גישה אסורה - נדרש טוקן אימות' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { _id: decoded.id, role: decoded.role };
            next();
        } catch (err) {
            return res.status(401).json({ error: 'טוקן לא תקף' });
        }
    }
