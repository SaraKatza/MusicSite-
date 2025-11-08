import Joi from "joi";
import { Schema, model } from "mongoose";

const songSchema = new Schema({
    name: { type: String, required: true, trim: true },
    idSinger: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    creationDate: { type: Date, default: Date.now, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Categories', required: true },
    urlSong: { type: String, required: true },
    urlImg: { type: String, required: true },
    DownloadCount: { type: Number, default: 0, min: 0 },
});

export const songValidator = {
    post: Joi.object({
        name: Joi.string().required(),
        idSinger: Joi.string().hex().length(24).required(),
        creationDate: Joi.date().default(Date.now),
        categoryId: Joi.string().hex().length(24).required(),
        // urlSong and urlImg are files uploaded via multipart/form-data and
        // are processed by multer; the controller will populate the paths.
        // therefore we don't require them here in the validator.
        DownloadCount: Joi.number().min(0).default(0),
    }),
    put: Joi.object({
        name: Joi.string().min(1),
        idSinger: Joi.string().hex().length(24),
        creationDate: Joi.date(),
        categoryId: Joi.string().hex().length(24), // תיקון שם השדה
        urlImg: Joi.string(),
        urlSong: Joi.string(),
        DownloadCount: Joi.number().min(0),
    })// דורש לפחות שדה אחד לעדכון
};

export const Song = model('Songs', songSchema);