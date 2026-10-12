import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

// En-tête commun à toutes les pages de l'espace connecté (/dashboard/...)
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="text-base font-semibold tracking-tight">
              ServiceHub
            </Link>
            <Link
              href="/dashboard/password"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Mot de passe
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">{children}</main>
    </div>
  );
}
