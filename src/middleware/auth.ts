// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User from "../models/User.model";

/**
 * protect middleware
 * - Accepts token from cookie (priority) or Authorization header ("Bearer <token>")
 * - Verifies token and attaches user (without password) to req.user
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // get token from cookie first, then Authorization header
    const cookieToken = (req as any).cookies?.token || req.cookies?.token;
    const header = req.headers.authorization;
    const headerToken =
      header && header.startsWith("Bearer ") ? header.split(" ")[1] : undefined;

    const token = cookieToken || headerToken;
    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // verifyToken should throw if invalid/expired
    const payload = verifyToken(token) as { id?: string } | undefined;
    if (!payload?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(payload.id)
      .select("-password")
      .lean()
      .exec();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // attach user to request for downstream handlers
    (req as any).user = user;
    next();
  } catch (err) {
    // token verify failures etc.
    return res
      .status(401)
      .json({ message: "Not authorized", error: (err as Error).message });
  }
};
