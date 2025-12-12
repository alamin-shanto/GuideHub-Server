// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.model";
import asyncHandler from "../middleware/asyncHandler";

type Maybe<T> = T | null;

// ENV + CONSTANTS
const COOKIE_NAME = process.env.COOKIE_NAME || "token";

// Ensure SECRET is properly cast as jwt.Secret
const JWT_SECRET: Secret =
  (process.env.JWT_SECRET as Secret) || "dev_secret_change_me";

// Token expiration (TS-safe)
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as any) || "7d";

const DEFAULT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const REMEMBER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// --------------------------------------------------------
// COOKIE OPTIONS (Render + Vercel cross-site compatible)
// --------------------------------------------------------
function cookieOptions(maxAge = DEFAULT_COOKIE_MAX_AGE) {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge,
    path: "/",
  };
}

// --------------------------------------------------------
// TOKEN HELPERS
// --------------------------------------------------------
function signToken(payload: object) {
  const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, opts);
}

function getTokenFromReq(req: Request): Maybe<string> {
  const cookieToken = (req as any).cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }

  return null;
}

// --------------------------------------------------------
// POST /api/auth/register
// SAVE ROLE CORRECTLY 🔥
// --------------------------------------------------------
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body || {};

  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const existing = await User.findOne({ email }).lean().exec();
  if (existing)
    return res.status(409).json({ message: "Email already registered" });

  // 🔥 FIX: SAVE ROLE FROM CLIENT
  const user = new User({
    name,
    email,
    password,
    role: role || "tourist",
  });

  await user.save();

  const token = signToken({ id: user._id.toString() });

  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// --------------------------------------------------------
// POST /api/auth/login
// RETURNS ROLE 🔥
// --------------------------------------------------------
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, remember } = req.body || {};

  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const user = await User.findOne({ email }).select("+password").exec();
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch =
    typeof (user as any).comparePassword === "function"
      ? await (user as any).comparePassword(password)
      : await bcrypt.compare(password, user.password);

  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id.toString() });

  const opts = cookieOptions(
    remember ? REMEMBER_COOKIE_MAX_AGE : DEFAULT_COOKIE_MAX_AGE
  );

  res.cookie(COOKIE_NAME, token, opts);

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// --------------------------------------------------------
// POST /api/auth/logout
// --------------------------------------------------------
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/",
  });

  res.json({ ok: true });
});

// --------------------------------------------------------
// GET /api/auth/me
// RETURNS ROLE 🔥
// --------------------------------------------------------
export const me = asyncHandler(async (req: Request, res: Response) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id?: string };

    if (!payload?.id) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(payload.id)
      .select("-password")
      .lean()
      .exec();

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});
