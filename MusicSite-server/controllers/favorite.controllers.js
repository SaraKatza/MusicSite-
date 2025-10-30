import { Favorite } from '../models/favorite.models.js';
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// הוספת פריט (שיר/זמר) למועדפים
export async function addFavorite(req, res, next) {
    try {
        const userId = req.user._id;
        const { type, itemId } = req.body; // type: 'song' או 'singer'
        if (!isValidId(userId) || !isValidId(itemId)) return next({ message: 'Invalid id', status: 400 });
        
        const exists = await Favorite.findOne({ 
            userid: userId, 
            songorsinger: type, 
            idsongorsinger: itemId 
        });
        
        if (exists) {
            return next({ message: 'Item already exists in favorites', status: 400 });
        }
        
        const favorite = await Favorite.create({ 
            userid: userId, 
            songorsinger: type, 
            idsongorsinger: itemId 
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
        const favorites = await Favorite.find({ userid: userId })
            .populate('idsongorsinger');
        if (!favorites.length) {
            return next({ message: 'No favorites found', status: 204 });
        }
        res.status(200).json(favorites);
    } catch (err) {
        return next({ message: `Failed to retrieve favorites: ${err.message}`, status: 500 });
    }
}