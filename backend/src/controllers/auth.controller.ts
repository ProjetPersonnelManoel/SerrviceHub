// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import { AuthService, toPublicUser } from "../services/auth.services";
import { AuthRepository } from "../repositories/auth.repositories";
import { AppError } from "../utils/AppError";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie";

const service = new AuthService();
const repo = new AuthRepository();

// Express 5 transmet automatiquement les erreurs async à errorHandler
// Le JWT voyage uniquement dans le cookie httpOnly : il n'est jamais renvoyé dans le JSON
export class AuthController {
  register = async (req: Request, res: Response) => {
    const { token, user } = await service.register(req.body);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  };

  login = async (req: Request, res: Response) => {
    const { token, user } = await service.login(req.body);
    setAuthCookie(res, token);
    res.json({ user });
  };

  me = async (req: Request, res: Response) => {
    const user = await repo.findUserById(req.user!.id);
    if (!user) throw new AppError(404, "Utilisateur introuvable");
    res.json({ user: toPublicUser(user) });
  };

  // Pas besoin d'être authentifié : on doit pouvoir effacer un cookie expiré
  logout = async (req: Request, res: Response) => {
    clearAuthCookie(res);
    res.status(204).end();
  };

  changePassword = async (req: Request, res: Response) => {
    await service.changePassword(req.user!.id, req.body);
    res.status(204).end();
  };
}
