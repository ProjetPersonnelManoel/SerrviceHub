import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Exemples :
//   router.post("/login", validate(loginSchema), controller.login)
//   router.get("/:id", validate(idParamSchema, "params"), controller.getById)
export function validate(schema: z.ZodType, source: "body" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: z.flattenError(result.error).fieldErrors,
      });
    }
    // Remplace le body par la version nettoyée (trim, minuscules, champs inconnus retirés).
    // Les params restent du texte (type Express) : le controller les convertit, la validation garantit qu'ils sont corrects
    if (source === "body") req.body = result.data;
    next();
  };
}
