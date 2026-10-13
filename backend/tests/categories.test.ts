import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { User } from "../src/types/auth.types";
import type { Category } from "../src/types/categories.types";
import { generateToken } from "../src/utils/jwt";

// Bases de données en mémoire : remplacent les repositories MySQL
const store = vi.hoisted(() => ({
  users: [] as User[],
  categories: [] as Category[],
  usedIds: new Set<number>(), // catégories "utilisées" par une demande ou un prestataire
  nextId: 1,
}));

// authenticate() relit l'utilisateur en base : on simule seulement findUserById
vi.mock("../src/repositories/auth.repositories", () => ({
  AuthRepository: class {
    async findUserById(id: number) {
      return store.users.find((u) => u.id === id) ?? null;
    }
  },
}));

vi.mock("../src/repositories/categories.repositories", () => ({
  CategoryRepository: class {
    async getAllCategories() {
      return [...store.categories].sort((a, b) => a.name.localeCompare(b.name));
    }
    async getCategoryById(id: number) {
      return store.categories.find((c) => c.id === id) ?? null;
    }
    async getCategoriesByParentId(parentId: number | null) {
      return store.categories.filter((c) => c.parentId === parentId);
    }
    async findCategoryByNameAndParent(name: string, parentId: number | null) {
      // MySQL compare sans tenir compte de la casse
      return (
        store.categories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase() && c.parentId === parentId,
        ) ?? null
      );
    }
    async hasChildren(id: number) {
      return store.categories.some((c) => c.parentId === id);
    }
    async isUsed(id: number) {
      return store.usedIds.has(id);
    }
    async createCategory(data: { name: string; parentId?: number | null }) {
      const category = { id: store.nextId++, name: data.name, parentId: data.parentId ?? null };
      store.categories.push(category);
      return category;
    }
    async updateCategory(id: number, data: { name?: string; parentId?: number | null }) {
      const category = store.categories.find((c) => c.id === id);
      if (!category) return null;
      Object.assign(category, data);
      return category;
    }
    async deleteCategory(id: number) {
      store.categories = store.categories.filter((c) => c.id !== id);
    }
  },
}));

import type { Express } from "express";

let app: Express;

function addUser(id: number, role: User["role"]) {
  store.users.push({
    id,
    role,
    email: `user${id}@mail.com`,
    password: "hash",
    firstName: "Test",
    lastName: "User",
    city: "Paris",
    emailVerified: false,
    isActive: true,
    createdAt: new Date(),
  });
  return `token=${generateToken({ id, role })}`;
}

function addCategory(name: string, parentId: number | null = null) {
  const category = { id: store.nextId++, name, parentId };
  store.categories.push(category);
  return category;
}

let admin: string;
let client: string;

beforeEach(async () => {
  store.users = [];
  store.categories = [];
  store.usedIds = new Set();
  store.nextId = 1;
  vi.resetModules();
  const { createApp } = await import("../src/app");
  app = createApp();
  admin = addUser(1000, "ADMIN");
  client = addUser(1001, "CLIENT");
});

describe("GET /api/categories", () => {
  it("est public et renvoie l'arbre (catégories principales + sous-catégories)", async () => {
    const maison = addCategory("Maison");
    addCategory("Plomberie", maison.id);
    addCategory("Cours");

    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
    expect(res.body.categories[0].name).toBe("Cours"); // trié par nom
    expect(res.body.categories[1]).toMatchObject({
      name: "Maison",
      children: [{ name: "Plomberie", parentId: maison.id }],
    });
  });
});

describe("GET /api/categories/:id", () => {
  it("renvoie la catégorie avec ses sous-catégories", async () => {
    const maison = addCategory("Maison");
    addCategory("Plomberie", maison.id);

    const res = await request(app).get(`/api/categories/${maison.id}`);
    expect(res.status).toBe(200);
    expect(res.body.category.children).toHaveLength(1);
  });

  it("renvoie 404 si elle n'existe pas", async () => {
    const res = await request(app).get("/api/categories/999");
    expect(res.status).toBe(404);
  });

  it("renvoie 400 si l'id n'est pas un nombre", async () => {
    const res = await request(app).get("/api/categories/abc");
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("id");
  });
});

describe("POST /api/categories", () => {
  it("crée une catégorie (ADMIN)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "  Informatique " });

    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: "Informatique", parentId: null });
  });

  it("crée une sous-catégorie", async () => {
    const maison = addCategory("Maison");
    const res = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "Peinture", parentId: maison.id });

    expect(res.status).toBe(201);
    expect(res.body.category.parentId).toBe(maison.id);
  });

  it("refuse sans connexion (401) et pour un non-admin (403)", async () => {
    const anonymous = await request(app).post("/api/categories").send({ name: "X" });
    expect(anonymous.status).toBe(401);

    const asClient = await request(app)
      .post("/api/categories")
      .set("Cookie", client)
      .send({ name: "X" });
    expect(asClient.status).toBe(403);
  });

  it("refuse un nom vide (400)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "   " });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("name");
  });

  it("refuse un parent inexistant (400)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "Peinture", parentId: 999 });
    expect(res.status).toBe(400);
  });

  it("refuse un 3e niveau (400)", async () => {
    const maison = addCategory("Maison");
    const plomberie = addCategory("Plomberie", maison.id);
    const res = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "Fuites", parentId: plomberie.id });
    expect(res.status).toBe(400);
  });

  it("refuse un doublon sous le même parent (409), mais l'accepte sous un autre", async () => {
    const maison = addCategory("Maison");
    const auto = addCategory("Auto");
    addCategory("Réparation", maison.id);

    const duplicate = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "réparation", parentId: maison.id });
    expect(duplicate.status).toBe(409);

    const otherParent = await request(app)
      .post("/api/categories")
      .set("Cookie", admin)
      .send({ name: "Réparation", parentId: auto.id });
    expect(otherParent.status).toBe(201);
  });
});

describe("PATCH /api/categories/:id", () => {
  it("renomme une catégorie", async () => {
    const cours = addCategory("Cours");
    const res = await request(app)
      .patch(`/api/categories/${cours.id}`)
      .set("Cookie", admin)
      .send({ name: "Soutien scolaire" });
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe("Soutien scolaire");
  });

  it("parentId: null remonte une sous-catégorie en catégorie principale", async () => {
    const maison = addCategory("Maison");
    const jardin = addCategory("Jardin", maison.id);
    const res = await request(app)
      .patch(`/api/categories/${jardin.id}`)
      .set("Cookie", admin)
      .send({ parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.category.parentId).toBeNull();
  });

  it("refuse un body vide (400)", async () => {
    const cours = addCategory("Cours");
    const res = await request(app)
      .patch(`/api/categories/${cours.id}`)
      .set("Cookie", admin)
      .send({});
    expect(res.status).toBe(400);
  });

  it("refuse qu'une catégorie soit son propre parent (400)", async () => {
    const cours = addCategory("Cours");
    const res = await request(app)
      .patch(`/api/categories/${cours.id}`)
      .set("Cookie", admin)
      .send({ parentId: cours.id });
    expect(res.status).toBe(400);
  });

  it("refuse de déplacer sous un parent une catégorie qui a des enfants (400)", async () => {
    const maison = addCategory("Maison");
    addCategory("Plomberie", maison.id);
    const cours = addCategory("Cours");
    const res = await request(app)
      .patch(`/api/categories/${maison.id}`)
      .set("Cookie", admin)
      .send({ parentId: cours.id });
    expect(res.status).toBe(400);
  });

  it("refuse un renommage qui crée un doublon (409)", async () => {
    addCategory("Cours");
    const maison = addCategory("Maison");
    const res = await request(app)
      .patch(`/api/categories/${maison.id}`)
      .set("Cookie", admin)
      .send({ name: "Cours" });
    expect(res.status).toBe(409);
  });

  it("renvoie 404 si la catégorie n'existe pas", async () => {
    const res = await request(app)
      .patch("/api/categories/999")
      .set("Cookie", admin)
      .send({ name: "X" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/categories/:id", () => {
  it("supprime une catégorie libre (204)", async () => {
    const cours = addCategory("Cours");
    const res = await request(app).delete(`/api/categories/${cours.id}`).set("Cookie", admin);
    expect(res.status).toBe(204);
    expect(store.categories).toHaveLength(0);
  });

  it("refuse si elle a des sous-catégories (409)", async () => {
    const maison = addCategory("Maison");
    addCategory("Plomberie", maison.id);
    const res = await request(app).delete(`/api/categories/${maison.id}`).set("Cookie", admin);
    expect(res.status).toBe(409);
  });

  it("refuse si elle est utilisée (409)", async () => {
    const cours = addCategory("Cours");
    store.usedIds.add(cours.id);
    const res = await request(app).delete(`/api/categories/${cours.id}`).set("Cookie", admin);
    expect(res.status).toBe(409);
  });

  it("refuse pour un non-admin (403)", async () => {
    const cours = addCategory("Cours");
    const res = await request(app).delete(`/api/categories/${cours.id}`).set("Cookie", client);
    expect(res.status).toBe(403);
  });
});
