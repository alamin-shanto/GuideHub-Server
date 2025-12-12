import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.model";
import asyncHandler from "../middleware/asyncHandler";

/**
 * Small Request type that includes `user` (set by your auth middleware).
 * We keep it local to avoid touching global type declarations.
 */
type RequestWithUser = Request & { user?: any };

const signToken = (id: string) => {
  const secret: jwt.Secret =
    (process.env.JWT_SECRET as jwt.Secret) || "dev_secret";

  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      "7d") as unknown as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign({ id }, secret, options);
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already used" });

  const user = new User({ name, email, password });
  await user.save();

  const token = signToken(user._id.toString());
  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing credentials" });

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user._id.toString());
  res.json({
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
});

export const me = asyncHandler(async (req: RequestWithUser, res: Response) => {
  // auth middleware attaches req.user
  res.json({ user: req.user });
});
