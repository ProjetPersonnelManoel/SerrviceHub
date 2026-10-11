import jwt, { type SignOptions } from "jsonwebtoken";
import "dotenv/config";
import type { JwtPayload } from "../types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET manquant dans le .env");

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ??
  "1h") as SignOptions["expiresIn"];

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
}

// Lève une erreur si le token est invalide ou expiré
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET!) as JwtPayload;
}
