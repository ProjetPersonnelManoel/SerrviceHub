import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

// Route inexistante
export function notFoundHandler(req: Request, res: Response) {
  res
    .status(404)
    .json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
}

// Violation d'une contrainte UNIQUE MySQL (Drizzle place l'erreur d'origine dans `cause`)
function isDuplicateEntry(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "ER_DUP_ENTRY" || e?.cause?.code === "ER_DUP_ENTRY";
}

// Gestionnaire d'erreurs global (doit être enregistré après toutes les routes)
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Ex. deux inscriptions simultanées avec le même email
  if (isDuplicateEntry(err)) {
    return res.status(409).json({ message: "Cette ressource existe déjà" });
  }

  // Erreurs d'Express (ex. JSON mal formé : status 400)
  const status = (err as { status?: number }).status;
  if (status && status < 500) {
    return res.status(status).json({ message: "Requête invalide" });
  }

  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur" });
}
