import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import expenseRoutes from './routes/expenseRoutes';
import categoryRoutes from './routes/categoryRoutes';
import borrowRoutes from './routes/borrowRoutes';
import emiRoutes from './routes/emiRoutes';
import roomRoutes from './routes/roomRoutes';
import savingsRoutes from './routes/savingsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import incomeRoutes from './routes/incomeRoutes';
import { User } from './models/User';
// import { Category } from './models/Category';
// import { seedMockData } from './config/seedData';

// Initialize configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#EF4444', icon: 'Utensils', description: 'Meals and dining' },
  { name: 'Hotel', color: '#F59E0B', icon: 'Hotel', description: 'Hotel stays and lodging' },
  { name: 'Shopping', color: '#EC4899', icon: 'ShoppingBag', description: 'Clothing and personal items' },
  { name: 'Grocery', color: '#10B981', icon: 'ShoppingCart', description: 'Groceries and food supplies' },
  { name: 'Fuel', color: '#3B82F6', icon: 'Fuel', description: 'Petrol, diesel, vehicle fuel' },
  { name: 'Medical', color: '#8B5CF6', icon: 'HeartPulse', description: 'Medicines, hospital consults' },
  { name: 'Travel', color: '#06B6D4', icon: 'Plane', description: 'Flights, train, buses, commuting' },
  { name: 'Entertainment', color: '#D946EF', icon: 'Tv', description: 'Movies, streaming, outings' },
  { name: 'Electricity', color: '#EAB308', icon: 'Zap', description: 'Electricity bills' },
  { name: 'Internet', color: '#6366F1', icon: 'Wifi', description: 'Internet and WiFi connection' },
  { name: 'Zepto', color: '#A855F7', icon: 'Zap', description: 'Quick commerce Zepto deliveries' },
  { name: 'Swiggy', color: '#F97316', icon: 'Pizza', description: 'Food delivery Swiggy orders' },
  { name: 'Zomato', color: '#DC2626', icon: 'Pizza', description: 'Food delivery Zomato orders' },
];

// Connect to Database & Seed Initial Data
const initApp = async () => {
  await connectDB();

  // Seed default admin if missing
  try {
    const adminExists = await User.findOne({ email: 'sadha@admin.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'System Administrator',
        email: 'sadha@admin.com',
        password: 'sadha4545@',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AdminSystem',
      });
      await admin.save();
      console.log('Seeded Default Admin: admin@example.com / admin123');
    }
  } catch (err) {
    console.error('Failed to seed default database:', err);
  }

  // Seed standard default categories
  // try {
  //   for (const cat of DEFAULT_CATEGORIES) {
  //     const exists = await Category.findOne({ name: cat.name });
  //     if (!exists) {
  //       await Category.create(cat);
  //     }
  //   }
  //   console.log('Verified default category list.');
  //   // Seed initial mock transaction records
  //   await seedMockData();
  // } catch (err) {
  //   console.error('Failed to seed default category list:', err);
  // }

  // Start Listener
  const port = process.env.PORT || 4000

  app.listen(port || 5000, () => {
    console.log(`Fintro server successfully running on port ${PORT}`);
  });
};

// Express Middlewares
app.use(cors({
  origin: process.env.ALLOWED_CORS
}));
app.use(express.json({ limit: '10mb' }));

// Serve static uploaded receipts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes Bindings
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/income', incomeRoutes);

// Base Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Central Error Interceptor Middleware
app.use(errorHandler);

// Boot server
initApp().catch((err) => {
  console.error('Critical server startup failure:', err);
  process.exit(1);
});
