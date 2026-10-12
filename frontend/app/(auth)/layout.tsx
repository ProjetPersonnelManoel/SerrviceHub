// Mise en page commune aux pages de connexion et d'inscription
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="mb-6 text-center text-lg font-semibold tracking-tight">ServiceHub</p>
        {children}
      </div>
    </main>
  );
}
