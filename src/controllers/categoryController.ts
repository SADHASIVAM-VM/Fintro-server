import { Response } from 'express';
import { Category } from '../models/Category';
import { AuthenticatedRequest } from '../middleware/auth';

// GET CATEGORIES
export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    // Return standard default categories (no createdBy) AND user-created categories
    const categories = await Category.find({
      $or: [{ createdBy: { $exists: false } }, { createdBy: req.user.id }],
    });
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading categories' });
  }
};

// CREATE CATEGORY
export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { name, color, icon, description } = req.body;

  try {
    const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }

    const category = new Category({
      name,
      color,
      icon,
      description,
      createdBy: req.user.id,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating category' });
  }
};

// UPDATE CATEGORY (Admin Only)
export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
    return;
  }

  const { id } = req.params;
  const { name, color, icon, description } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    if (name) category.name = name;
    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (description) category.description = description;

    await category.save();
    res.status(200).json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating category' });
  }
};

// DELETE CATEGORY (Admin Only)
export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
    return;
  }

  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    // Don't allow deleting standard global default categories
    if (!category.createdBy) {
      res.status(400).json({ message: 'Cannot delete global default system categories' });
      return;
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting category' });
  }
};
