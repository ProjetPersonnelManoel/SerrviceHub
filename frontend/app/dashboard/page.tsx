import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Tableau de bord" };

const ROLE_LABELS = {
  CLIENT: "Client",
  PRESTATAIRE: "Prestataire",
  ADMIN: "Administrateur",
} as const;

export default async function DashboardPage() {
  // proxy.ts ne regarde que la présence du cookie : ici on vérifie vraiment la session
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/dashboard");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <span className="font-semibold tracking-tight">ServiceHub</span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Bonjour {user.firstName} 👋</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Vous êtes connecté.</p>

        <dl className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
          <Info label="Nom" value={`${user.firstName} ${user.lastName}`} />
          <Info label="Email" value={user.email} />
          <Info label="Type de compte" value={ROLE_LABELS[user.role]} />
          <Info
            label="Membre depuis"
            value={new Date(user.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
          />
        </dl>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-medium break-all">{value}</dd>
    </div>
  );
}
