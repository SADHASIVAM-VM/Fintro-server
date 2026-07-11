import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  color: string;
  icon: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    color: { type: String, required: true },
    icon: { type: String, required: true }, // lucide-react icon name
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
