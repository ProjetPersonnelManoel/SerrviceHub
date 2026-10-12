import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Changer mon mot de passe" };

export default async function PasswordPage() {
  // Le layout ne vérifie pas la session : chaque page protégée le fait elle-même
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/dashboard/password");

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Changer mon mot de passe</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Vous resterez connecté après la modification.
      </p>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
