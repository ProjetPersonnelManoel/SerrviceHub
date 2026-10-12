// Miroir de toPublicUser() côté backend (le hash n'est jamais renvoyé)
export type Role = "CLIENT" | "PRESTATAIRE" | "ADMIN";

export interface User {
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  city: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// État renvoyé par les actions de formulaire (useActionState)
export interface FormState {
  message?: string;
  // Message de confirmation (ex. "Mot de passe modifié")
  success?: string;
  errors?: Record<string, string[] | undefined>;
  // Valeurs saisies, pour ne pas vider le formulaire en cas d'erreur
  values?: Record<string, string>;
}
