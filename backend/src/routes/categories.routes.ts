import { Router } from "express";
import { CategoriesController } from "../controllers/categories.controller";
import { authenticate, authorize } from "../middlewares/auth.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import {
  categoryIdParamSchema,
  categorySchema,
  categoryUpdateSchema,
} from "../Validation/categories.validation";

export const categoriesRouter = (): Router => {
  const router = Router();
  const controller = new CategoriesController();
  const adminOnly = [authenticate, authorize("ADMIN")];
  const validId = validate(categoryIdParamSchema, "params");

  // Lecture : publique (formulaires d'inscription prestataire, création de demande...)
  router.get("/", controller.getAll);
  router.get("/:id", validId, controller.getById);

  // Écriture : réservée aux administrateurs
  router.post("/", ...adminOnly, validate(categorySchema), controller.create);
  router.patch(
    "/:id",
    ...adminOnly,
    validId,
    validate(categoryUpdateSchema),
    controller.update,
  );
  router.delete("/:id", ...adminOnly, validId, controller.delete);

  return router;
};
