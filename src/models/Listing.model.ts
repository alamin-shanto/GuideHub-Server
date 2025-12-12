import mongoose, { Document, Schema } from "mongoose";

export interface ListingDocument extends Document {
  title: string;
  description: string;
  price: number;
  city?: string;
  images?: string[];
  host: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<ListingDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    city: { type: String },
    images: [{ type: String }],
    host: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Listing ||
  mongoose.model<ListingDocument>("Listing", ListingSchema);
