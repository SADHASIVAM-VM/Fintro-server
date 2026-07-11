import { v2 as UploadApiResponse } from 'cloudinary';
import cloudinary from "../util/cloudinaryUpload";
import fs from 'fs';
import path from 'path';

export const cloudnairyUpload = async (file: any, folder: string = "Invoices"): Promise<{ success: boolean; Url?: any; error?: string }> => {


    if (!file || !file.path) {
        // console.error("Cloudinary upload failed: No file path provided.");
        return { success: false, error: "No file path provided" };
    }

    try {
        const fileBaseName = path.parse(file.originalname || 'upload').name;
        const publicId = `${fileBaseName}-${Date.now()}`;

        const uploadResult = await cloudinary.uploader.upload(file.path, {
            public_id: publicId,
            folder: folder ? folder : "invoice"
        });

        // Clean up the local temp file after successful upload
        // try {
        //     if (fs.existsSync(file.path)) {
        //         fs.unlinkSync(file.path);
        //         console.log("Successfully deleted local temp file:", file.path);
        //     }
        // } catch (cleanupError) {
        //     console.error("Failed to delete local temp file:", cleanupError);
        // }

        return {
            success: true,
            Url: uploadResult
        };
    } catch (error: any) {
        console.error("Cloudinary upload service error:", error);

        // Clean up the local temp file even if the upload failed
        try {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log("Deleted local temp file after upload failure:", file.path);
            }
        } catch (cleanupError) {
            console.error("Failed to delete local temp file during error handling:", cleanupError);
        }

        return {
            success: false,
            error: error.message || "Failed to upload image to Cloudinary"
        };
    }
}