import type { Response } from "express";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "token";

const cookieOptions = {
  httpOnly: true, // inaccessible depuis le JavaScript du navigateur (protège contre le XSS)
  secure: process.env.NODE_ENV === "production", // HTTPS uniquement en prod
  sameSite: "lax" as const, // pas envoyé par les POST venant d'un autre site (protège contre le CSRF)
  path: "/",
};

// Le cookie expire en même temps que le JWT qu'il contient
export function setAuthCookie(res: Response, token: string) {
  const { exp } = jwt.decode(token) as { exp: number };
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    expires: new Date(exp * 1000),
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
