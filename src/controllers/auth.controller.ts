// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.model";
import asyncHandler from "../middleware/asyncHandler";

type Maybe<T> = T | null;

const COOKIE_NAME = process.env.COOKIE_NAME || "token";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const DEFAULT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const REMEMBER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function cookieOptions(
  maxAge = Number(process.env.COOKIE_MAX_AGE || DEFAULT_COOKIE_MAX_AGE)
) {
  const isProd = process.env.NODE_ENV === "production";

  const opts: Record<string, any> = {
    httpOnly: true,
    maxAge,
    path: "/",
  };

  if (isProd) {
    opts.secure = true;
    opts.sameSite = "none";
    if (process.env.COOKIE_DOMAIN) opts.domain = process.env.COOKIE_DOMAIN;
  } else {
    opts.secure = false;
    opts.sameSite = "lax";
  }

  return opts;
}

function signToken(payload: object) {
  // cast JWT_SECRET to Secret and options to SignOptions to satisfy TypeScript overloads
  const secret = JWT_SECRET as Secret;
  const options = { expiresIn: JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, secret, options);
}

function getTokenFromReq(req: Request): Maybe<string> {
  const cookieToken = (req as any).cookies?.[COOKIE_NAME] || undefined;
  if (cookieToken) return cookieToken;

  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.split(" ")[1];
  return null;
}

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const existing = await User.findOne({ email }).lean().exec();
  if (existing)
    return res.status(409).json({ message: "Email already registered" });

  const user = new User({ name, email, password });
  await user.save();

  const token = signToken({ id: user._id.toString() });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, remember } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const user = await User.findOne({ email }).select("+password").exec();
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch =
    typeof (user as any).comparePassword === "function"
      ? await (user as any).comparePassword(password)
      : await bcrypt.compare(password, (user as any).password);

  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id.toString() });

  const opts = cookieOptions(remember ? REMEMBER_COOKIE_MAX_AGE : undefined);
  res.cookie(COOKIE_NAME, token, opts);

  res.json({ user: { id: user._id, name: user.name, email: user.email } });
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  });
  res.json({ ok: true });
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET as Secret) as { id?: string };
    if (!payload?.id) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(payload.id)
      .select("-password")
      .lean()
      .exec();
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});
