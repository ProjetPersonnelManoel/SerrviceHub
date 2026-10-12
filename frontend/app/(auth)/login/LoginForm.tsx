"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type { FormState, User } from "@/lib/types";
import { FormField } from "@/components/FormField";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

// N'accepte que les chemins internes (évite une redirection ouverte via ?from=https://...)
function safeRedirect(from?: string) {
  const isInternal = from?.startsWith("/") && !from.startsWith("//") && !from.startsWith("/\\");
  return isInternal ? from! : "/dashboard";
}

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter();

  async function login(_prev: FormState, formData: FormData): Promise<FormState> {
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    try {
      await apiFetch<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, "Une erreur est survenue");
      // On ne renvoie jamais le mot de passe dans l'état
      return { message: err.message, errors: err.errors, values: { email: values.email } };
    }
    router.replace(safeRedirect(from));
    router.refresh();
    return {};
  }

  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form key={state.values?.email} action={formAction} className="flex flex-col gap-4" noValidate>
      <FormMessage message={state.errors ? undefined : state.message} />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.errors?.email}
      />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.errors?.password}
      />
      <SubmitButton pending={pending} pendingText="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}
