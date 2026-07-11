"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const Category_1 = require("../models/Category");
// GET CATEGORIES
const getCategories = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        // Return standard default categories (no createdBy) AND user-created categories
        const categories = await Category_1.Category.find({
            $or: [{ createdBy: { $exists: false } }, { createdBy: req.user.id }],
        });
        res.status(200).json(categories);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading categories' });
    }
};
exports.getCategories = getCategories;
// CREATE CATEGORY
const createCategory = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { name, color, icon, description } = req.body;
    try {
        const existing = await Category_1.Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing) {
            res.status(400).json({ message: 'Category already exists' });
            return;
        }
        const category = new Category_1.Category({
            name,
            color,
            icon,
            description,
            createdBy: req.user.id,
        });
        await category.save();
        res.status(201).json(category);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating category' });
    }
};
exports.createCategory = createCategory;
// UPDATE CATEGORY (Admin Only)
const updateCategory = async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden. Admin access required.' });
        return;
    }
    const { id } = req.params;
    const { name, color, icon, description } = req.body;
    try {
        const category = await Category_1.Category.findById(id);
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        if (name)
            category.name = name;
        if (color)
            category.color = color;
        if (icon)
            category.icon = icon;
        if (description)
            category.description = description;
        await category.save();
        res.status(200).json(category);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating category' });
    }
};
exports.updateCategory = updateCategory;
// DELETE CATEGORY (Admin Only)
const deleteCategory = async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden. Admin access required.' });
        return;
    }
    const { id } = req.params;
    try {
        const category = await Category_1.Category.findById(id);
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        // Don't allow deleting standard global default categories
        if (!category.createdBy) {
            res.status(400).json({ message: 'Cannot delete global default system categories' });
            return;
        }
        await Category_1.Category.findByIdAndDelete(id);
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting category' });
    }
};
exports.deleteCategory = deleteCategory;
