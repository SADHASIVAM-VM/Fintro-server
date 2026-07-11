import { cloudnairyUpload } from "../services/upload.service"


export const uploadImageToCloud = async (req: any, res: any) => {

    try {
        const receiptImage = (req as any).file?.file?.path
        console.log(receiptImage, "⭐⭐⭐")

        const result = await cloudnairyUpload(receiptImage)

        console.log(result)

    }
    catch (error: any) {
        res.status(500).json({ message: error.message || 'Error upload image' });


    }
}