import { cloudnairyUpload } from "../services/upload.service"


export const uploadImageToCloud = async (req: any, res: any) => {
    try {
        const file = req.file;
        console.log("File received in controller:", file, "⭐⭐⭐");

        const result = await cloudnairyUpload(file);
        console.log("Cloudinary upload result:", result);

        res.status(200).json(result);
    }
    catch (error: any) {
        res.status(500).json({ message: error.message || 'Error upload image' });
    }
}