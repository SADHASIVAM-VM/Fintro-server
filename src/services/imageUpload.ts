import multer from 'multer';
import path from 'path';
import fs from 'fs';


const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const filetypes = /jpeg|jpg|png|pdf|webp/;
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
