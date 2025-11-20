import Joi from "joi";
import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: { type: String, required: true, trim: true, minlength: 2 },
    password: { type: String, required: true, minlength: 6 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    img: { type: String }, // רק זמר
    role: { type: String, enum: ['admin', 'singer', 'user'], default: 'user' },
});

// הצפנת סיסמה
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
});
userSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();

    // אם הסיסמה קיימת בעדכון – מצפינים אותה
    if (update.password) {
        const salt = await bcrypt.genSalt(12);
        update.password = await bcrypt.hash(update.password, salt);

        this.setUpdate(update);
    }
});


export const User = model('Users', userSchema);

export const userValidator = {
    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Email must be valid',
        }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters long',
        }),
    }),
    register: Joi.object({
        name: Joi.string().min(2).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
        }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters long',
        }),
        email: Joi.string().email().lowercase().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Email must be a valid email address',
        }),

        role: Joi.string().valid('admin', 'singer', 'user').default('user').messages({
            'any.only': 'Role must be admin, singer, or user',
        }),

    }),
    put: Joi.object({
        name: Joi.string().min(2).optional().messages({
            'string.min': 'Name must be at least 2 characters long',
        }),
        password: Joi.string().min(6).optional().messages({
            'string.min': 'Password must be at least 6 characters long',
        }),
        email: Joi.string().email().lowercase().optional().messages({
            'string.email': 'Email must be a valid email address',
        }),
        role: Joi.string().valid('admin', 'singer', 'user').optional().messages({
            'any.only': 'Role must be admin, singer, or user',
        }),
    }),
};