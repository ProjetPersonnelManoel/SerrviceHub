import { z } from "zod";

// trim + minuscules AVANT de vérifier le format (" Toto@Mail.com " devient valide)
const emailField = z
  .string("Email requis")
  .trim()
  .toLowerCase()
  .pipe(z.email("Email invalide"));

// Règles d'un nouveau mot de passe (inscription et changement)
const newPasswordField = z
  .string("Mot de passe requis")
  .min(8, "8 caractères minimum")
  .max(72, "72 caractères maximum"); // bcrypt ignore au-delà de 72 octets

export const registerSchema = z.object({
  email: emailField,
  password: newPasswordField,
  firstName: z.string("Prénom requis").trim().min(1, "Prénom requis").max(100),
  lastName: z.string("Nom requis").trim().min(1, "Nom requis").max(100),
  role: z.enum(["CLIENT", "PRESTATAIRE"]).optional(), // pas ADMIN à l'inscription !
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string("Mot de passe requis").min(1, "Mot de passe requis"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string("Mot de passe actuel requis")
      .min(1, "Mot de passe actuel requis"),
    newPassword: newPasswordField,
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel",
    path: ["newPassword"],
  });

// Les types sont déduits des schémas : plus besoin de les écrire à la main
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
