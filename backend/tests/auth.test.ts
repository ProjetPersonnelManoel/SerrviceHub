import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { User } from "../src/types/auth.types";

// Base de données en mémoire : remplace le repository MySQL pour ne pas dépendre de la vraie base
const store = vi.hoisted(() => ({ users: [] as User[], nextId: 1 }));

vi.mock("../src/repositories/auth.repositories", () => ({
  AuthRepository: class {
    async findUserByEmail(email: string) {
      return store.users.find((u) => u.email === email) ?? null;
    }
    async findUserById(id: number) {
      return store.users.find((u) => u.id === id) ?? null;
    }
    async createUser(data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: User["role"];
    }) {
      const user: User = {
        id: store.nextId++,
        role: data.role ?? "CLIENT",
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        city: null,
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
      };
      store.users.push(user);
      return user;
    }
    async updatePassword(id: number, hashedPassword: string) {
      const user = store.users.find((u) => u.id === id);
      if (user) user.password = hashedPassword;
    }
  },
}));

import type { Express } from "express";

let app: Express;

const validUser = {
  email: "jean.dupont@mail.com",
  password: "MotDePasse123",
  firstName: "Jean",
  lastName: "Dupont",
};

const getCookies = (res: request.Response) =>
  res.headers["set-cookie"] as unknown as string[];

// Inscrit un utilisateur et renvoie le cookie d'authentification
async function registerAndGetCookie() {
  const res = await request(app).post("/api/auth/register").send(validUser);
  expect(res.status).toBe(201);
  return getCookies(res);
}

beforeEach(async () => {
  store.users = [];
  store.nextId = 1;
  // Modules rechargés à chaque test : les compteurs du rate limit repartent de zéro
  vi.resetModules();
  const { createApp } = await import("../src/app");
  app = createApp();
});

describe("GET /api/ping", () => {
  it("répond pong", async () => {
    const res = await request(app).get("/api/ping");
    expect(res.status).toBe(200);
    expect(res.text).toBe("pong");
  });
});

describe("Routes inconnues", () => {
  it("renvoie 404", async () => {
    const res = await request(app).get("/api/nexiste-pas");
    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Route introuvable");
  });
});

describe("POST /api/auth/register", () => {
  it("crée un utilisateur, pose le cookie httpOnly et ne renvoie pas le mot de passe", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, email: "  Jean.Dupont@Mail.com " });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: "jean.dupont@mail.com", // trim + minuscules
      firstName: "Jean",
      role: "CLIENT",
    });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBeUndefined(); // le JWT n'est que dans le cookie

    const cookie = getCookies(res)[0];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toContain("HttpOnly");

    // Le mot de passe est stocké haché
    expect(store.users[0].password).not.toBe(validUser.password);
  });

  it("refuse un email déjà utilisé (409)", async () => {
    await registerAndGetCookie();
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(409);
  });

  it("refuse des données invalides (400)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "pas-un-email",
      password: "court",
      firstName: "",
      lastName: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("email");
    expect(res.body.errors).toHaveProperty("password");
    expect(res.body.errors).toHaveProperty("firstName");
  });

  it("refuse le rôle ADMIN à l'inscription (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, role: "ADMIN" });
    expect(res.status).toBe(400);
  });

  it("renvoie 400 sur un JSON mal formé", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send("{ pas du json");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("connecte un utilisateur avec les bons identifiants", async () => {
    await registerAndGetCookie();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    expect(getCookies(res)[0]).toMatch(/^token=/);
  });

  it("refuse un mauvais mot de passe (401)", async () => {
    await registerAndGetCookie();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "mauvais" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Identifiants invalides");
  });

  it("renvoie le même message pour un email inconnu (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inconnu@mail.com", password: "peu-importe" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Identifiants invalides");
  });

  it("refuse un compte désactivé (403)", async () => {
    await registerAndGetCookie();
    store.users[0].isActive = false;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/auth/me", () => {
  it("renvoie l'utilisateur connecté", async () => {
    const cookie = await registerAndGetCookie();
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it("refuse sans cookie (401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("refuse un token invalide (401)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", ["token=token.bidon.invalide"]);
    expect(res.status).toBe(401);
  });

  it("refuse un compte désactivé même avec un token valide (401)", async () => {
    const cookie = await registerAndGetCookie();
    store.users[0].isActive = false;
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("efface le cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(204);
    expect(getCookies(res)[0]).toMatch(/^token=;/);
  });
});

describe("PATCH /api/auth/password", () => {
  it("change le mot de passe", async () => {
    const cookie = await registerAndGetCookie();
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookie)
      .send({ currentPassword: validUser.password, newPassword: "NouveauMdp456" });
    expect(res.status).toBe(204);

    // L'ancien mot de passe ne fonctionne plus, le nouveau oui
    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "NouveauMdp456" });
    expect(newLogin.status).toBe(200);
  });

  it("refuse un mot de passe actuel incorrect (400)", async () => {
    const cookie = await registerAndGetCookie();
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookie)
      .send({ currentPassword: "mauvais", newPassword: "NouveauMdp456" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Mot de passe actuel incorrect");
  });

  it("refuse sans authentification (401)", async () => {
    const res = await request(app)
      .patch("/api/auth/password")
      .send({ currentPassword: "a", newPassword: "NouveauMdp456" });
    expect(res.status).toBe(401);
  });
});

describe("Rate limit sur /login", () => {
  it("bloque la 6e tentative après 5 échecs (429)", async () => {
    const tryLogin = () =>
      request(app)
        .post("/api/auth/login")
        .send({ email: "inconnu@mail.com", password: "x" });

    for (let i = 0; i < 5; i++) expect((await tryLogin()).status).toBe(401);
    expect((await tryLogin()).status).toBe(429);
  });
});
