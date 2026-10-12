// Appels à l'API depuis le navigateur.
// Les URLs sont relatives : next.config.ts relaie /api/* vers le backend Express,
// et le cookie httpOnly "token" est envoyé automatiquement (même origine).

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Serveur injoignable, réessayez plus tard");
  }

  // 204 No Content (logout, changement de mot de passe)
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Le rate limiter peut renvoyer autre chose que { message }
    const message =
      res.status === 429
        ? "Trop de tentatives, réessayez dans quelques minutes"
        : (data.message ?? "Une erreur est survenue");
    throw new ApiError(res.status, message, data.errors);
  }
  return data as T;
}
