import mongoose, { Document, Schema } from "mongoose";

export interface GuideDocument extends Document {
  name: string;
  location?: string;
  rating?: number;
  img?: string;
  bio?: string;
  tags?: string[];
  city?: string;
  price_per_hour?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const GuideSchema = new Schema<GuideDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    img: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    city: {
      type: String,
      trim: true,
    },

    price_per_hour: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "Guides" }
);

// prevents model overwrite when using hot reload
export default mongoose.models.Guide ||
  mongoose.model<GuideDocument>("Guide", GuideSchema);
