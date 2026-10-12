"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type { FormState } from "@/lib/types";
import { FormField } from "@/components/FormField";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function ChangePasswordForm() {
  const router = useRouter();

  async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // Le backend ne connaît pas la confirmation : c'est au frontend de la vérifier
    if (newPassword !== confirmPassword) {
      return { errors: { confirmPassword: ["Les mots de passe ne correspondent pas"] } };
    }

    try {
      await apiFetch("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, "Une erreur est survenue");
      // Session expirée entre-temps : retour à la connexion
      if (err.status === 401) {
        router.replace("/login?from=/dashboard/password");
        return {};
      }
      // 400 sans détail par champ = "Mot de passe actuel incorrect" : on l'affiche sous le bon champ
      if (err.status === 400 && !err.errors) {
        return { errors: { currentPassword: [err.message] } };
      }
      return { message: err.message, errors: err.errors };
    }
    // React vide le formulaire après l'action : les champs sont remis à zéro
    return { success: "Mot de passe modifié avec succès" };
  }

  const [state, formAction, pending] = useActionState(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormMessage message={state.errors ? undefined : state.message} />
      {state.success && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          {state.success}
        </p>
      )}

      <FormField
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        errors={state.errors?.currentPassword}
      />
      <FormField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        placeholder="8 caractères minimum"
        errors={state.errors?.newPassword}
      />
      <FormField
        label="Confirmer le nouveau mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.errors?.confirmPassword}
      />

      <SubmitButton pending={pending} pendingText="Modification…">
        Modifier le mot de passe
      </SubmitButton>
    </form>
  );
}
