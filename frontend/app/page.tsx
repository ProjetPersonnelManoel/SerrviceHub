import { redirect } from "next/navigation";

// Pas encore de page d'accueil : on envoie vers le tableau de bord (ou /login si non connecté)
export default function Home() {
  redirect("/dashboard");
}
