import type { categories } from "../db/schema";

// Déduit de la table Drizzle : suit automatiquement le schéma (id: number, name, parentId)
export type Category = typeof categories.$inferSelect;

// Catégorie avec ses sous-catégories (réponse de GET /api/categories)
export type CategoryTree = Category & { children: Category[] };

export type { CategoryRequest } from "../Validation/categories.validation";
export type { CategoryUpdateRequest } from "../Validation/categories.validation";
