"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const error_1 = require("./middleware/error");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const borrowRoutes_1 = __importDefault(require("./routes/borrowRoutes"));
const emiRoutes_1 = __importDefault(require("./routes/emiRoutes"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
const savingsRoutes_1 = __importDefault(require("./routes/savingsRoutes"));
const reportsRoutes_1 = __importDefault(require("./routes/reportsRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const incomeRoutes_1 = __importDefault(require("./routes/incomeRoutes"));
// import { Category } from './models/Category';
// import { seedMockData } from './config/seedData';
// Initialize configuration
dotenv_1.default.config();
const app = (0, express_1.default)();
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
    await (0, db_1.connectDB)();
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
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log(`Fintro server successfully running on port ${PORT}`);
    });
};
// Express Middlewares
// app.use(cors({
//   origin: process.env.ALLOWED_CORS
// }));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Serve static uploaded receipts
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes Bindings
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/expenses', expenseRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/borrow', borrowRoutes_1.default);
app.use('/api/emi', emiRoutes_1.default);
app.use('/api/room', roomRoutes_1.default);
app.use('/api/savings', savingsRoutes_1.default);
app.use('/api/reports', reportsRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
app.use('/api/income', incomeRoutes_1.default);
// Base Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Central Error Interceptor Middleware
app.use(error_1.errorHandler);
// Boot server
initApp().catch((err) => {
    console.error('Critical server startup failure:', err);
    process.exit(1);
});
