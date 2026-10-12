import { cookies } from "next/headers";
import type { User } from "./types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
export const AUTH_COOKIE = "token";

// Vérification réelle de la session (Server Components) : le backend valide le JWT
// et vérifie que le compte existe toujours. Renvoie null si non connecté.
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { Cookie: `${AUTH_COOKIE}=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const { user } = (await res.json()) as { user: User };
  return user;
}
