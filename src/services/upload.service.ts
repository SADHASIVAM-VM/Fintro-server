import cloudinary from "../util/cloudinaryUpload";
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export const cloudnairyUpload = async (file: any, folder: string = "Invoices"): Promise<{ success: boolean; Url?: any; error?: string }> => {
    if (!file) {
        return { success: false, error: "No file provided" };
    }

    let fileBuffer = file.buffer;
    if (!fileBuffer && file.path && fs.existsSync(file.path)) {
        try {
            fileBuffer = fs.readFileSync(file.path);
        } catch (err) {
            console.error("Failed to read file from disk path:", err);
        }
    }

    if (!fileBuffer) {
        return { success: false, error: "No file buffer provided" };
    }

    try {
        const fileBaseName = path.parse(file.originalname || 'upload').name;
        const publicId = `${fileBaseName}-${Date.now()}`;

        let processedBuffer = fileBuffer;
        let processedMimetype = file.mimetype;

        // If the file is an image, compress and convert it to AVIF using sharp
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            try {
                processedBuffer = await sharp(fileBuffer)
                    .avif({ quality: 70 }) // High quality compression
                    .toBuffer();
                processedMimetype = 'image/avif';
            } catch (sharpError) {
                console.error("Sharp image conversion/compression failed, using original file buffer:", sharpError);
            }
        }

        // Convert buffer to data URI for Cloudinary
        const base64File = `data:${processedMimetype};base64,${processedBuffer.toString("base64")}`;

        const uploadResult = await cloudinary.uploader.upload(base64File, {
            public_id: publicId,
            folder: folder ? folder : "invoice",
            resource_type: "auto"
        });

        return {
            success: true,
            Url: uploadResult
        };
    } catch (error: any) {
        console.error("Cloudinary upload service error:", error);

        return {
            success: false,
            error: error.message || "Failed to upload image to Cloudinary"
        };
    }
}