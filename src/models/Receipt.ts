import mongoose, { Schema, Document } from 'mongoose';

export type OCRStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExtractedData {
  merchant?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD
  tax?: number;
  invoiceNumber?: string;
  items?: Array<{ name: string; price: number }>;
  suggestedCategory?: string;
  paymentMethod?: string;
}

export interface IReceipt extends Document {
  userId: mongoose.Types.ObjectId;
  fileUrl: string;
  thumbnailUrl?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  ocrStatus: OCRStatus;
  ocrText?: string;
  extractedData?: ExtractedData;
  confidence?: number;
  isConfirmed: boolean;
}

const ReceiptSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    originalFilename: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    ocrStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    ocrText: { type: String },
    extractedData: {
      merchant: { type: String },
      amount: { type: Number },
      date: { type: String },
      tax: { type: Number },
      invoiceNumber: { type: String },
      items: [{ name: String, price: Number }],
      suggestedCategory: { type: String },
      paymentMethod: { type: String },
    },
    confidence: { type: Number, default: 0.9 },
    isConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReceiptSchema.index({ userId: 1, isConfirmed: 1 });

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
export default Receipt;
