import { z } from "zod";

const nameField = z
  .string("Nom requis")
  .trim()
  .min(1, "Nom requis")
  .max(100, "100 caractères maximum");

// null = catégorie principale
const parentIdField = z
  .number("Parent invalide")
  .int("Parent invalide")
  .positive("Parent invalide")
  .nullable();

export const categorySchema = z.object({
  name: nameField,
  parentId: parentIdField.optional(),
});

// Tous les champs sont optionnels, mais il en faut au moins un (sinon Drizzle plante sur un set vide)
export const categoryUpdateSchema = z
  .object({
    name: nameField.optional(),
    parentId: parentIdField.optional(),
  })
  .refine((d) => d.name !== undefined || d.parentId !== undefined, {
    message: "Aucune modification fournie",
    path: ["name"],
  });

// Id dans l'URL (/api/categories/:id) : arrive en texte, converti en entier positif
export const categoryIdParamSchema = z.object({
  id: z.coerce.number("Id invalide").int("Id invalide").positive("Id invalide"),
});

export type CategoryRequest = z.infer<typeof categorySchema>;
export type CategoryUpdateRequest = z.infer<typeof categoryUpdateSchema>;
