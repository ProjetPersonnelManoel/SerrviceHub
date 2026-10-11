import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AUTH_COOKIE } from "../utils/authCookie";
import { AppError } from "../utils/AppError";
import { AuthRepository } from "../repositories/auth.repositories";
import type { JwtPayload } from "../types/auth.types";

// Ajoute req.user au type Request d'Express
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const repo = new AuthRepository();

// Lit le JWT dans le cookie httpOnly, puis vérifie que le compte existe toujours et est actif
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token: string | undefined = req.cookies?.[AUTH_COOKIE];
  if (!token) throw new AppError(401, "Non authentifié");

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, "Session invalide ou expirée");
  }

  // Un compte désactivé ou supprimé perd l'accès tout de suite, même avec un token encore valide
  const user = await repo.findUserById(payload.id);
  if (!user || !user.isActive)
    throw new AppError(401, "Session invalide ou expirée");

  // Le rôle vient de la base (toujours à jour), pas du token
  req.user = { id: user.id, role: user.role };
  next();
}

// À placer après authenticate. Exemple : authorize("ADMIN") ou authorize("PRESTATAIRE", "ADMIN")
export function authorize(...roles: JwtPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "Accès interdit");
    }
    next();
  };
}
