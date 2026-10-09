// Chargement des dépendances
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import yaml from "yamljs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./routes/auth.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middlewares";

// Construit l'application sans la démarrer (utilisé par server.ts et par les tests)
export const createApp = () => {
  const app = express();
  const isDev = process.env.NODE_ENV === "development";

  // Derrière un reverse proxy (Nginx) en prod : nécessaire pour que le rate limit voie la vraie IP
  if (process.env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      // Avec des cookies, l'origine doit être explicite ("*" est refusé par les navigateurs)
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    }),
  );

  app.use(express.json());
  app.use(cookieParser());

  // Configuration des routes
  if (isDev) {
    app.use(
      "/swagger",
      swaggerUi.serve,
      swaggerUi.setup(yaml.load(path.resolve(process.cwd(), "swagger.yml"))),
    );
  }

  app.get("/api/ping", (req, res) => {
    res.status(200).send("pong");
  });

  app.use("/api/auth", authRouter());

  // Gestion des erreurs (après toutes les routes)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
