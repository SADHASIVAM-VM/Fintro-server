import cloudinary from "../util/cloudinaryUpload";
import path from 'path';
import sharp from 'sharp';

export const cloudnairyUpload = async (file: any, folder: string = "Invoices"): Promise<{ success: boolean; Url?: any; error?: string }> => {


    if (!file || !file.buffer) {
        // console.error("Cloudinary upload failed: No file buffer provided.");
        return { success: false, error: "No file buffer provided" };
    }

    try {
        const fileBaseName = path.parse(file.originalname || 'upload').name;
        const publicId = `${fileBaseName}-${Date.now()}`;

        let processedBuffer = file.buffer;
        let processedMimetype = file.mimetype;

        // If the file is an image, compress and convert it to AVIF using sharp
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            try {
                processedBuffer = await sharp(file.buffer)
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