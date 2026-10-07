import { Document, Schema, model } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  description: string;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    versionKey: false,
  },
);

export const CategoryModel = model<CategoryDocument>(
  'Category',
  categorySchema,
);