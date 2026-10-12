"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      // Le backend efface le cookie httpOnly (inaccessible depuis le JavaScript)
      await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={logout}
      disabled={pending}
      className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
