import Joi from "joi";
import { Schema, model } from "mongoose";

const favoriteSchema = new Schema({
    userid: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    songorsinger: { type: String, enum: ['song', 'singer'], required: true },
    idsongorsinger: { type: Schema.Types.ObjectId, required: true },
});

favoriteSchema.index({ userid: 1, songorsinger: 1, idsongorsinger: 1 }, { unique: true });

export const Favorite = model('Favorites', favoriteSchema);

export const favoriteValidator = Joi.object({
    userid: Joi.string().hex().length(24).required(),
    songorsinger: Joi.string().valid("song", "singer").required(),
    idsongorsinger: Joi.string().hex().length(24).required(),
});