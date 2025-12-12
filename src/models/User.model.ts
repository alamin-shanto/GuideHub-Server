import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: "tourist" | "guide" | "admin";
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // 🔥 Role support for tourist, guide, admin
    role: {
      type: String,
      enum: ["tourist", "guide", "admin"],
      default: "tourist",
    },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.models.User ||
  mongoose.model<UserDocument>("User", UserSchema);
