"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.getUploadDir = void 0;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const getUploadDir = () => {
    const isServerless = !!(process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (isServerless) {
        const tmpUploads = path_1.default.join(os_1.default.tmpdir(), 'uploads');
        try {
            if (!fs_1.default.existsSync(tmpUploads)) {
                fs_1.default.mkdirSync(tmpUploads, { recursive: true });
            }
            return tmpUploads;
        }
        catch {
            return os_1.default.tmpdir();
        }
    }
    const localUploads = path_1.default.join(__dirname, '../uploads');
    try {
        if (!fs_1.default.existsSync(localUploads)) {
            fs_1.default.mkdirSync(localUploads, { recursive: true });
        }
        return localUploads;
    }
    catch {
        const tmpUploads = path_1.default.join(os_1.default.tmpdir(), 'uploads');
        try {
            if (!fs_1.default.existsSync(tmpUploads)) {
                fs_1.default.mkdirSync(tmpUploads, { recursive: true });
            }
        }
        catch { }
        return tmpUploads;
    }
};
exports.getUploadDir = getUploadDir;
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, (0, exports.getUploadDir)());
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (_req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf|webp|avif|bmp|jfif/;
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    },
});
exports.default = exports.upload;
