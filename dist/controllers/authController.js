"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.refresh = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_123_abc_xyz';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_123_abc_xyz';
const generateTokens = (id, role) => {
    const token = jsonwebtoken_1.default.sign({ id, role }, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
    return { token, refreshToken };
};
// SIGN UP
const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await User_1.User.findOne({ email });
        if (existing) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
        const user = new User_1.User({ name, email, password, avatar });
        await user.save();
        const { token, refreshToken } = generateTokens(user.id, user.role);
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            token,
            refreshToken,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating user account' });
    }
};
exports.register = register;
// SIGN IN
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User_1.User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        const { token, refreshToken } = generateTokens(user.id, user.role);
        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            token,
            refreshToken,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error signing in user' });
    }
};
exports.login = login;
// REFRESH TOKEN
const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ message: 'User session has expired' });
            return;
        }
        const tokens = generateTokens(user.id, user.role);
        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            token: tokens.token,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};
exports.refresh = refresh;
// PROFILE
const getProfile = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        const user = await User_1.User.findById(req.user.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error getting profile' });
    }
};
exports.getProfile = getProfile;
