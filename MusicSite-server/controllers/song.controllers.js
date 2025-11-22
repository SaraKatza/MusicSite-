
import { Song } from '../models/song.models.js';
import { Favorite } from '../models/favorite.models.js';
import mongoose from 'mongoose';
import path from 'path';
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
// יצירת שיר חדש
export async function addSong(req, res, next) {
    try {
        const songData = req.body;
        
        // --- 1. טיפול בקובץ השיר (urlSong) ---
        // קבצים משדות מרובים נשמרים ב-req.files
        const songFileArray = req.files && req.files['urlSong'];
        if (!songFileArray || songFileArray.length === 0) {
            return next({ message: 'Song file is required', status: 400 });
        }
        
        const songFile = songFileArray[0];
        // בניית הנתיב הציבורי לשיר
        songData.urlSong = `/uploads/${songFile.filename}`; 

        
        // --- 2. טיפול בקובץ התמונה (urlImg) ---
        const imageFileArray = req.files && req.files['urlImg'];
        // בדיקה אם תמונה נשלחה (בהנחה שתמונת השיר היא חובה)
        if (!imageFileArray || imageFileArray.length === 0) {
            return next({ message: 'Image file for the song is required', status: 400 });
        }
        
        const imageFile = imageFileArray[0];
        // בניית הנתיב הציבורי לתמונה
        songData.urlImg = `/uploads/${imageFile.filename}`;
        
        
        // 3. יצירת האובייקט והבדיקה
        const newSong = new Song(songData); // יצירת האובייקט באמצעות songData המעודכן
        
        // בדיקה אם השיר קיים כבר
        const existingSong = await Song.findOne({ name: newSong.name, idSinger: newSong.idSinger });
        if (existingSong) {
            return next({ message: 'Song already exists', status: 400 });
        }
        
        await newSong.save();
        res.status(201).json(newSong);
    } catch (err) {
        return next({ message: `Failed to add song: ${err.message}`, status: 500 });
    }
}
// ------------------------------------------------------------------
// שליפת כל השירים
// ------------------------------------------------------------------
export async function getAllSongs(req, res, next) {
    try {
        console.log("singer" ,req.query);
        if(req.query.singerId!=null){
            return getSongsBySinger(req, res, next);
        }
        if(req.query.categoryId!=null){
            return getSongsByCategory(req, res, next);
        }
        if(req.query.search!=null){
            return getSongsBySearch(req, res, next);
        }
        const songs = await Song.find()
            .populate('idSinger', 'name') // שליפת שם הזמר
            .populate('categoryId', 'name'); // שליפת שם הקטגוריה
        if (!songs.length) {
            return next({ message: 'No songs found', status: 204 });
        }
        res.status(200).json(songs);
        
    } catch (err) {
        return next({ message: `Failed to retrieve songs: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// שליפת שיר אחד ספציפי
// ------------------------------------------------------------------
export async function getSong(req, res, next) {
    try {
        const songId = req.params.id;
        if (!isValidId(songId)) return next({ message: 'Invalid song id', status: 400 });
        const song = await Song.findById(songId)
            .populate('idSinger', 'name') // שליפת שם הזמר
            .populate('categoryId', 'name'); // שליפת שם הקטגוריה
        if (!song) {
            return next({ message: 'Song not found', status: 404 });
        }
        res.status(200).json(song);
    } catch (err) {
        return next({ message: `Failed to retrieve song: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// עדכון שיר (כולל אפשרות לעדכן שיר ותמונה)
// ------------------------------------------------------------------
export async function updateSong(req, res, next) {
    try {
        const songId = req.params.id;
        if (!isValidId(songId)) return next({ message: 'Invalid song id', status: 400 });
        const updateData = req.body; // מתחילים עם הנתונים הטקסטואליים
        
        // --- 1. טיפול בקובץ השיר (urlSong) - אם קיים ---
        const songFileArray = req.files && req.files['urlSong'];
        if (songFileArray && songFileArray.length > 0) {
            const songFile = songFileArray[0];
            updateData.urlSong = `/uploads/${songFile.filename}`; // בניית הנתיב הציבורי לשיר
        }

        // --- 2. טיפול בקובץ התמונה (urlImg) - אם קיים ---
        const imageFileArray = req.files && req.files['urlImg'];
        if (imageFileArray && imageFileArray.length > 0) {
            const imageFile = imageFileArray[0];
            updateData.urlImg = `/uploads/${imageFile.filename}`; // בניית הנתיב הציבורי לתמונה
        }
        
        // הערה: בעדכון אנחנו מעדכנים רק אם נשלחו קבצים חדשים (לא חובה)

        const updatedSong = await Song.findByIdAndUpdate(
            songId,
            updateData, // משתמשים ב-updateData המעודכן
            { new: true, runValidators: true } // מחזיר את המסמך החדש ומפעיל ולידציה
        );
        
        if (!updatedSong) {
            return next({ message: 'Song not found', status: 404 });
        }
        res.status(200).json(updatedSong);
    } catch (err) {
        return next({ message: `Failed to update song: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// מחיקת שיר
// ------------------------------------------------------------------
export async function deleteSong(req, res, next) {
    try {
        const songId = req.params.id;
        if (!isValidId(songId)) return next({ message: 'Invalid song id', status: 400 });
        const deletedSong = await Song.findByIdAndDelete(songId);
        if (!deletedSong) {
            return next({ message: 'Song not found', status: 404 });
        }
        res.status(204).send(); // הצלחה ללא תוכן
    } catch (err) {
        return next({ message: `Failed to delete song: ${err.message}`, status: 500 });
    }
}

// ------------------------------------------------------------------
// קבלת כל השירים של זמר מסוים
// ------------------------------------------------------------------
export async function getSongsBySinger(req, res, next) {
    try {
        const singerId = req.query.singerId;
        console.log('Singer ID:', singerId);
        if (!isValidId(singerId)) return next({ message: 'Invalid singer id', status: 400 });
        const songs = await Song.find({ idSinger: singerId })
            .populate('idSinger', 'name') // שליפת שם הזמר
            .populate('categoryId', 'name'); // שליפת שם הקטגוריה
        if (!songs.length) {
            return next({ message: 'No songs found for this singer', status: 404 });
        }
        res.status(200).json(songs);
    } catch (err) {
        return next({ message: `Failed to retrieve singer's songs: ${err.message}`, status: 500 });
    }
}
export async function getSongsBySearch(req, res, next) {
    try {
        const { search = '' } = req.query;
        if (!search) return next({ message: 'Missing search term', status: 400 });
        const songs = await Song.find({ name: { $regex: search, $options: 'i' } })
            .populate('idSinger', 'name')
            .populate('categoryId', 'name');
        if (!songs.length) return next({ message: 'No songs found', status: 204 });
        res.status(200).json(songs);
    } catch (err) {
        next({ message: `Failed to search songs: ${err.message}`, status: 500 });
    }
}
//הורדת שיר עם תוקן
export async function downloadSong(req, res, next) {
    try {
        const songId = req.params.id;
        if (!isValidId(songId)) return next({ message: 'Invalid song id', status: 400 });

        const song = await Song.findById(songId);
        if (!song) return next({ message: 'Song not found', status: 404 });

        song.DownloadCount += 1;
        await song.save();

        const filePath = path.join(process.cwd(), 'public', song.urlSong);
        res.download(filePath, `${song.name}.mp3`, (err) => {
            if (err) next({ message: 'File not found on server', status: 404 });
        });
    } catch (err) {
        next({ message: `Failed to download song: ${err.message}`, status: 500 });
    }
}

//שירים לפי קטגוריות
export async function getSongsByCategory(req, res, next) {
    try {
        const categoryId = req.params.categoryId;
        if (!isValidId(categoryId)) return next({ message: 'Invalid category id', status: 400 });

        const { search = '' } = req.query;
        let query = { categoryId };
        if (search) query.name = { $regex: search, $options: 'i' };

        const songs = await Song.find(query)
            .populate('idSinger', 'name')
            .populate('categoryId', 'name');

        if (!songs.length) return next({ message: 'No songs found', status: 204 });
        res.status(200).json(songs);
    } catch (err) {
        next({ message: `Failed to retrieve songs: ${err.message}`, status: 500 });
    }
}
//רשימת זמרים
export async function getSingers(req, res, next) {
    try {
        const singers = await Song.aggregate([
            { $group: { _id: '$idSinger' } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'singerInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: { $arrayElemAt: ['$singerInfo.name', 0] }
                }
            }
        ]);
        res.status(200).json(singers);
    } catch (err) {
        next({ message: `Failed to retrieve singers: ${err.message}`, status: 500 });
    }
}
