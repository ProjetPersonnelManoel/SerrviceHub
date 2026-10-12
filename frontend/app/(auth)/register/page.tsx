import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Inscription" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Rejoignez ServiceHub en quelques secondes.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Se connecter
        </Link>
      </p>
    </>
  );
}
