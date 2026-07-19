import cloudinary from "../util/cloudinaryUpload";
import path from 'path';

export const cloudnairyUpload = async (file: any, folder: string = "Invoices"): Promise<{ success: boolean; Url?: any; error?: string }> => {


    if (!file || !file.buffer) {
        // console.error("Cloudinary upload failed: No file buffer provided.");
        return { success: false, error: "No file buffer provided" };
    }

    try {
        const fileBaseName = path.parse(file.originalname || 'upload').name;
        const publicId = `${fileBaseName}-${Date.now()}`;

        // Convert buffer to data URI for Cloudinary
        const base64File = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

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