import Joi from "joi";
import { Schema, model } from "mongoose";

const categorySchema = new Schema({
    name: { 
        type: String, 
        unique: true, 
        required: true, 
        trim: true, 
        minlength: 2 
    },
});

export const Category = model('Categories', categorySchema);

export const categoryValidator = Joi.object({
    name: Joi.string().min(2).required(),
});