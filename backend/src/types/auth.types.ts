export interface User {
  id: number;
  email: string;
  password: string;
  role: "CLIENT" | "PRESTATAIRE" | "ADMIN";
  firstName: string;
  lastName: string;
  city: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Déduits des schémas Zod (source unique de vérité)
export type {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
} from "../Validation/auth.validation";

export interface JwtPayload {
  id: number;
  role: "CLIENT" | "PRESTATAIRE" | "ADMIN";
}
