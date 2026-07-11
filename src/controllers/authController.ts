import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_123_abc_xyz';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_123_abc_xyz';

const generateTokens = (id: string, role: string) => {
  const token = jwt.sign({ id, role }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
};

// SIGN UP
export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    const user = new User({ name, email, password, avatar });
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
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating user account' });
  }
};

// SIGN IN
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
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
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error signing in user' });
  }
};

// REFRESH TOKEN
export const refresh = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    
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
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// PROFILE
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error getting profile' });
  }
};
