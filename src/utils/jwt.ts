// src/utils/jwt.ts
import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET ||
  "please_change_this_secret") as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: object) {
  const options = { expiresIn: JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string) {
  // jwt.verify returns string | object | JwtPayload depending on token — we keep it `any`
  return jwt.verify(token, JWT_SECRET) as any;
}
