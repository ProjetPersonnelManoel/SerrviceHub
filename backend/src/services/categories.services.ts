import { CategoryRepository } from "../repositories/categories.repositories";
import { AppError } from "../utils/AppError";
import type {
  Category,
  CategoryRequest,
  CategoryTree,
  CategoryUpdateRequest,
} from "../types/categories.types";

const repo = new CategoryRepository();

const DUPLICATE_MESSAGE = "Une catégorie avec ce nom existe déjà à cet endroit";

// Règles : 2 niveaux maximum (catégorie > sous-catégorie), pas de doublon sous un même parent,
// pas de suppression d'une catégorie qui a des sous-catégories ou qui est utilisée
export class CategoryService {
  // Arbre complet en une seule requête : les catégories principales avec leurs sous-catégories
  async getCategoryTree(): Promise<CategoryTree[]> {
    const all = await repo.getAllCategories(); // déjà triées par nom
    return all
      .filter((c) => c.parentId === null)
      .map((root) => ({
        ...root,
        children: all.filter((c) => c.parentId === root.id),
      }));
  }

  async getCategoryById(id: number): Promise<CategoryTree> {
    const category = await this.findOrFail(id);
    const children = await repo.getCategoriesByParentId(id);
    return { ...category, children };
  }

  async createCategory(data: CategoryRequest): Promise<Category> {
    const parentId = data.parentId ?? null;
    if (parentId !== null) await this.assertValidParent(parentId);
    await this.assertNoDuplicate(data.name, parentId);
    return repo.createCategory({ name: data.name, parentId });
  }

  async updateCategory(id: number, data: CategoryUpdateRequest): Promise<Category> {
    const existing = await this.findOrFail(id);

    // Attention : "??" remplacerait un parentId: null volontaire (retour en catégorie principale)
    const name = data.name ?? existing.name;
    const parentId = data.parentId !== undefined ? data.parentId : existing.parentId;

    if (parentId !== null && parentId !== existing.parentId) {
      await this.assertValidParent(parentId, id);
      // Une catégorie qui a des sous-catégories ne peut pas devenir elle-même une sous-catégorie (3 niveaux)
      if (await repo.hasChildren(id)) {
        throw new AppError(
          400,
          "Cette catégorie a des sous-catégories : elle ne peut pas devenir une sous-catégorie",
        );
      }
    }
    await this.assertNoDuplicate(name, parentId, id);

    const updated = await repo.updateCategory(id, data);
    if (!updated) throw new AppError(404, "Catégorie introuvable");
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.findOrFail(id);
    if (await repo.hasChildren(id)) {
      throw new AppError(409, "Supprimez d'abord les sous-catégories de cette catégorie");
    }
    if (await repo.isUsed(id)) {
      throw new AppError(
        409,
        "Cette catégorie est utilisée par des demandes ou des prestataires",
      );
    }
    await repo.deleteCategory(id);
  }

  private async findOrFail(id: number): Promise<Category> {
    const category = await repo.getCategoryById(id);
    if (!category) throw new AppError(404, "Catégorie introuvable");
    return category;
  }

  // Le parent doit exister, être une catégorie principale, et ne pas être la catégorie elle-même
  private async assertValidParent(parentId: number, selfId?: number) {
    if (parentId === selfId) {
      throw new AppError(400, "Une catégorie ne peut pas être son propre parent");
    }
    const parent = await repo.getCategoryById(parentId);
    if (!parent) throw new AppError(400, "Catégorie parente introuvable");
    if (parent.parentId !== null) {
      throw new AppError(400, "Une sous-catégorie ne peut pas avoir de sous-catégories");
    }
  }

  // excludeId : en modification, la catégorie elle-même n'est pas un doublon
  private async assertNoDuplicate(name: string, parentId: number | null, excludeId?: number) {
    const duplicate = await repo.findCategoryByNameAndParent(name, parentId);
    if (duplicate && duplicate.id !== excludeId) {
      throw new AppError(409, DUPLICATE_MESSAGE);
    }
  }
}
