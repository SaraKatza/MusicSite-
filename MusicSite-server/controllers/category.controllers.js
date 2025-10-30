import { Category } from "../models/category.models.js";
import { categoryValidator } from "../models/category.models.js";
import mongoose from 'mongoose';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// הוספת קטגוריה חדשה (מיועד למנהל)
export async function addCategory(req, res, next) {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        return next({ message: `Failed to add category: ${err.message}`, status: 400 });
    }
}

// קבלת כל הקטגוריות (מיועד לכולם)
export async function getAllCategories(req, res, next) {
    try {
        const categories = await Category.find();
        if (!categories.length) {
            return next({ message: 'No categories found', status: 204 });
        }
        res.status(200).json(categories);
    } catch (err) {
        return next({ message: `Server error: ${err.message}`, status: 500 });
    }
}

// קבלת קטגוריה לפי ID (מיועד לכולם)
export async function getCategory(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return next({ message: 'Invalid category id', status: 400 });
        const category = await Category.findById(req.params.id);
        if (!category) {
            return next({ message: 'Category not found', status: 204 });
        }
        res.status(200).json(category);
    } catch (err) {
        return next({ message: `Server error: ${err.message}`, status: 500 });
    }
}

// עדכון קטגוריה לפי ID (מיועד למנהל)
export async function updateCategory(req, res, next) {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!category) {
            return next({ message: 'Category not found', status: 204 });
        }
        res.status(200).json(category);
    } catch (err) {
        return next({ message: `Failed to update category: ${err.message}`, status: 400 });
    }
}

// מחיקת קטגוריה לפי ID (מיועד למנהל)
export async function deleteCategory(req, res, next) {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return next({ message: 'Category not found', status: 204 });
        }
        res.status(204).send();
    } catch (err) {
        return next({ message: `Server error: ${err.message}`, status: 500 });
    }
  }
