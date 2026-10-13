import { db } from "../db/connection";
import { categories, providerCategories, requests } from "../db/schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Category } from "../types/categories.types";

// Accès à la base uniquement : les règles métier (2 niveaux, doublons, suppression) sont dans le service
export class CategoryRepository {
  async getAllCategories(): Promise<Category[]> {
    // Tri par nom pour un affichage stable
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return category ?? null;
  }

  // parentId null = catégories principales.
  // En SQL, "parent_id = NULL" ne trouve jamais rien : il faut "IS NULL"
  async getCategoriesByParentId(parentId: number | null): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(
        parentId === null
          ? isNull(categories.parentId)
          : eq(categories.parentId, parentId),
      )
      .orderBy(asc(categories.name));
  }

  // Doublon = même nom sous le même parent (même règle IS NULL que ci-dessus)
  async findCategoryByNameAndParent(
    name: string,
    parentId: number | null,
  ): Promise<Category | null> {
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.name, name),
          parentId === null
            ? isNull(categories.parentId)
            : eq(categories.parentId, parentId),
        ),
      )
      .limit(1);
    return category ?? null;
  }

  async hasChildren(id: number): Promise<boolean> {
    const [child] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, id))
      .limit(1);
    return !!child;
  }

  // Utilisée par une demande client ou par un prestataire
  async isUsed(id: number): Promise<boolean> {
    const [request] = await db
      .select({ id: requests.id })
      .from(requests)
      .where(eq(requests.categoryId, id))
      .limit(1);
    if (request) return true;

    const [provider] = await db
      .select({ providerId: providerCategories.providerId })
      .from(providerCategories)
      .where(eq(providerCategories.categoryId, id))
      .limit(1);
    return !!provider;
  }

  async createCategory(data: {
    name: string;
    parentId?: number | null;
  }): Promise<Category> {
    const [result] = await db.insert(categories).values(data).$returningId();
    const category = await this.getCategoryById(result.id);
    if (!category) throw new Error("Failed to create category");
    return category;
  }

  // Le service vérifie avant que la catégorie existe et que data n'est pas vide
  async updateCategory(
    id: number,
    data: { name?: string; parentId?: number | null },
  ): Promise<Category | null> {
    await db.update(categories).set(data).where(eq(categories.id, id));
    return this.getCategoryById(id);
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}
