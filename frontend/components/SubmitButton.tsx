import type { ReactNode } from "react";

interface SubmitButtonProps {
  pending: boolean;
  children: ReactNode;
  pendingText: string;
}

export function SubmitButton({ pending, children, pendingText }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      {pending ? pendingText : children}
    </button>
  );
}
