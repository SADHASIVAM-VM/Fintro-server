"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const User_1 = require("../models/User");
// GET ALL USERS (with pagination, filter, search, sorting)
const getUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : '';
        const role = req.query.role ? String(req.query.role) : '';
        const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'name';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const query = {};
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
        const sortOption = {};
        sortOption[sortBy] = sortOrder;
        const total = await User_1.User.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const users = await User_1.User.find(query)
            .select('-password')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);
        res.status(200).json({
            data: users,
            total,
            page,
            limit,
            totalPages,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching users database' });
    }
};
exports.getUsers = getUsers;
// GET SINGLE USER BY ID
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User_1.User.findById(id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error getting user details' });
    }
};
exports.getUserById = getUserById;
// CREATE USER
const createUser = async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const existing = await User_1.User.findOne({ email });
        if (existing) {
            res.status(400).json({ message: 'Email address already registered' });
            return;
        }
        const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
        const pass = password || 'password123'; // Default fallback password
        const user = new User_1.User({ name, email, role, password: pass, avatar });
        await user.save();
        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating user account' });
    }
};
exports.createUser = createUser;
// UPDATE USER
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, avatar } = req.body;
    try {
        const user = await User_1.User.findById(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (name)
            user.name = name;
        if (email) {
            const existing = await User_1.User.findOne({ email, _id: { $ne: id } });
            if (existing) {
                res.status(400).json({ message: 'Email address is already in use by another user' });
                return;
            }
            user.email = email;
        }
        if (role)
            user.role = role;
        if (avatar)
            user.avatar = avatar;
        await user.save();
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating user profile' });
    }
};
exports.updateUser = updateUser;
// DELETE USER
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User_1.User.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting user account' });
    }
};
exports.deleteUser = deleteUser;
