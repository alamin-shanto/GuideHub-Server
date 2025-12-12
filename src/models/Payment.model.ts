import mongoose, { Document, Schema } from "mongoose";

export interface PaymentDocument extends Document {
  booking: mongoose.Types.ObjectId;
  stripeChargeId?: string;
  amount: number;
  status: "pending" | "succeeded" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    stripeChargeId: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model<PaymentDocument>("Payment", PaymentSchema);
