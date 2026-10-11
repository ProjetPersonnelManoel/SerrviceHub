import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Exemple : router.post("/login", validate(loginSchema), controller.login)
export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }
    // Remplace le body par la version nettoyée (trim, minuscules, champs inconnus retirés)
    req.body = result.data;
    next();
  };
}
