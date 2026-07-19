import { Response } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

// GET ALL USERS (with pagination, filter, search, sorting)
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search ? String(req.query.search) : '';
    const role = req.query.role ? String(req.query.role) : '';
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const query: any = {};

    // Search query check
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Role filter check
    if (role) {
      query.role = role;
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder;

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const users = await User.find(query)
      .select('-password')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedUsers = users.map((u: any) => ({
      ...u,
      id: u._id.toString(),
    }));

    res.status(200).json({
      data: formattedUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching users database' });
  }
};

// GET SINGLE USER BY ID
export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      ...user,
      id: user._id.toString(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error getting user details' });
  }
};

// CREATE USER
export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, role, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email address already registered' });
      return;
    }

    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    const pass = password || 'password123'; // Default fallback password

    const user = new User({ name, email, role, password: pass, avatar });
    await user.save();

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating user account' });
  }
};

// UPDATE USER
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, role, avatar } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        res.status(400).json({ message: 'Email address is already in use by another user' });
        return;
      }
      user.email = email;
    }
    if (role) user.role = role;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating user profile' });
  }
};

// DELETE USER
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting user account' });
  }
};
