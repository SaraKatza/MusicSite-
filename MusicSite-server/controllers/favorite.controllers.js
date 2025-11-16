import { Favorite } from '../models/favorite.models.js';
import { Song } from '../models/song.models.js';
import { User } from '../models/user.models.js';
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// הוספת פריט (שיר/זמר) למועדפים
export async function addFavorite(req, res, next) {
    try {
        const userId = req.user._id;
        const { songorsinger, idsongorsinger } = req.body; // type: 'song' או 'singer'
        if (!isValidId(userId) || !isValidId(idsongorsinger)) return next({ message: 'Invalid id', status: 400 });
        
        const exists = await Favorite.findOne({ 
            userid: userId, 
            songorsinger: songorsinger, 
            idsongorsinger: idsongorsinger 
        });
        
        if (exists) {
            return next({ message: 'הפריט כבר קיים במועדפים!', status: 409 });
        }
        
        const favorite = await Favorite.create({ 
            userid: userId, 
            songorsinger: songorsinger, 
            idsongorsinger: idsongorsinger 
        });
        
        res.status(201).json(favorite);
    } catch (err) {
        return next({ message: `Failed to add favorite: ${err.message}`, status: 500 });
    }
}

// מחיקת פריט מהמועדפים
export async function removeFavorite(req, res, next) {
    try {
        const userId = req.user._id;
        const favoriteId = req.params.id;
        if (!isValidId(userId) || !isValidId(favoriteId)) return next({ message: 'Invalid id', status: 400 });
        
        const deleted = await Favorite.findOneAndDelete({ 
            _id: favoriteId,
            userid: userId 
        });
        
        if (!deleted) {
            return next({ message: 'Item not found in favorites', status: 404 });
        }
        
        res.status(200).json({ message: 'Item removed from favorites' });
    } catch (err) {
        return next({ message: `Failed to remove favorite: ${err.message}`, status: 500 });
    }
}

// קבלת כל המועדפים של המשתמש
export async function getFavoritesByUser(req, res, next) {
    try {
        const userId = req.user._id;
        const favorites = await Favorite.find({ userid: userId });

        // אם אין מועדפים — מחזירים מערך ריק עם 204
        if (!favorites.length) {
            return res.status(204).json([]);
        }

        // הוספת שמות שיר/אמן להחזרה (עבור song בלבד כרגע)
        const songIds = favorites
            .filter(f => f.songorsinger === 'song')
            .map(f => f.idsongorsinger);

        const songs = await Song.find({ _id: { $in: songIds } })
            .populate('idSinger', 'name');
        const songMap = new Map(
            songs.map(s => [s._id.toString(), { songName: s.name, artistName: s.idSinger?.name || '' }])
        );

        const enriched = favorites.map(f => {
            const base = f.toObject();
            if (f.songorsinger === 'song') {
                const extra = songMap.get(f.idsongorsinger.toString()) || { songName: '', artistName: '' };
                return { ...base, ...extra };
            }
            return base;
        });

        res.status(200).json(enriched);
    } catch (err) {
        return next({ message: `Failed to retrieve favorites: ${err.message}`, status: 500 });
    }
}