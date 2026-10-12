import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { from } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Content de vous revoir.
      </p>
      <LoginForm from={typeof from === "string" ? from : undefined} />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Créer un compte
        </Link>
      </p>
    </>
  );
}
