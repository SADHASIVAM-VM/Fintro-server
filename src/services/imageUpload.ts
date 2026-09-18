import os from 'os';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

export const getUploadDir = (): string => {
  const isServerless = !!(process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpUploads = path.join(os.tmpdir(), 'uploads');
    try {
      if (!fs.existsSync(tmpUploads)) {
        fs.mkdirSync(tmpUploads, { recursive: true });
      }
      return tmpUploads;
    } catch {
      return os.tmpdir();
    }
  }

  const localUploads = path.join(__dirname, '../uploads');
  try {
    if (!fs.existsSync(localUploads)) {
      fs.mkdirSync(localUploads, { recursive: true });
    }
    return localUploads;
  } catch {
    const tmpUploads = path.join(os.tmpdir(), 'uploads');
    try {
      if (!fs.existsSync(tmpUploads)) {
        fs.mkdirSync(tmpUploads, { recursive: true });
      }
    } catch { }
    return tmpUploads;
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req: any, file: any, cb: any) => {
    const filetypes = /jpeg|jpg|png|pdf|webp|avif|bmp|jfif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed') as any);
    }
  },
});

export default upload;
