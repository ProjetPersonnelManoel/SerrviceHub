import { rateLimit } from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Connexion : seuls les échecs comptent (anti brute-force sur les mots de passe)
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives de connexion, réessayez dans 15 minutes",
  },
});

// Inscription, changement de mot de passe… : toutes les requêtes comptent
export const sensitiveLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Trop de requêtes, réessayez dans 15 minutes" },
});
