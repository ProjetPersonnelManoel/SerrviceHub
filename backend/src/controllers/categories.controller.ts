import type { Request, Response } from "express";
import { CategoryService } from "../services/categories.services";

const service = new CategoryService();

// L'id de l'URL est déjà validé par validate(categoryIdParamSchema, "params") : Number() est sûr
// Express 5 transmet automatiquement les erreurs async (AppError) à errorHandler
export class CategoriesController {
  getAll = async (req: Request, res: Response) => {
    const categories = await service.getCategoryTree();
    res.json({ categories });
  };

  getById = async (req: Request, res: Response) => {
    const category = await service.getCategoryById(Number(req.params.id));
    res.json({ category });
  };

  create = async (req: Request, res: Response) => {
    const category = await service.createCategory(req.body);
    res.status(201).json({ category });
  };

  update = async (req: Request, res: Response) => {
    const category = await service.updateCategory(Number(req.params.id), req.body);
    res.json({ category });
  };

  delete = async (req: Request, res: Response) => {
    await service.deleteCategory(Number(req.params.id));
    res.status(204).end();
  };
}
