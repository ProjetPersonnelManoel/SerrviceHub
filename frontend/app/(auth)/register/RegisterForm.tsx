"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type { FormState, User } from "@/lib/types";
import { FormField } from "@/components/FormField";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

const ROLES = [
  { value: "CLIENT", label: "Je cherche un service" },
  { value: "PRESTATAIRE", label: "Je propose mes services" },
] as const;

export function RegisterForm() {
  const router = useRouter();

  async function register(
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const values = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      city: String(formData.get("city") ?? ""),
      role: String(formData.get("role") ?? "CLIENT"),
    };
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // Seule vérification faite côté client : le reste est validé par le backend (Zod)
    if (password !== confirmPassword) {
      return {
        errors: { confirmPassword: ["Les mots de passe ne correspondent pas"] },
        values,
      };
    }

    try {
      // Le backend connecte directement l'utilisateur (cookie posé à l'inscription)
      await apiFetch<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...values, password }),
      });
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError(0, "Une erreur est survenue");
      return { message: err.message, errors: err.errors, values };
    }
    router.replace("/dashboard");
    router.refresh();
    return {};
  }

  const [state, formAction, pending] = useActionState(register, {});
  const v = state.values;

  return (
    // key : remonte le formulaire pour réappliquer les defaultValue après une erreur
    <form
      key={JSON.stringify(v)}
      action={formAction}
      className="flex flex-col gap-4"
      noValidate
    >
      <FormMessage message={state.errors ? undefined : state.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Prénom"
          name="firstName"
          autoComplete="given-name"
          required
          defaultValue={v?.firstName}
          errors={state.errors?.firstName}
        />
        <FormField
          label="Nom"
          name="lastName"
          autoComplete="family-name"
          required
          defaultValue={v?.lastName}
          errors={state.errors?.lastName}
        />
      </div>

      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={v?.email}
        errors={state.errors?.email}
      />
      <FormField
        label="Ville"
        name="city"
        autoComplete="address-level2"
        required
        defaultValue={v?.city}
        errors={state.errors?.city}
      />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Type de compte</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROLES.map((role) => (
            <label
              key={role.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-50 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-900"
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                defaultChecked={(v?.role ?? "CLIENT") === role.value}
                className="accent-zinc-900 dark:accent-zinc-100"
              />
              {role.label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        placeholder="8 caractères minimum"
        errors={state.errors?.password}
      />
      <FormField
        label="Confirmer le mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.errors?.confirmPassword}
      />

      <SubmitButton pending={pending} pendingText="Création du compte…">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}
