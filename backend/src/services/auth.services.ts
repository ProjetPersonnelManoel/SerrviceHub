import bcrypt from "bcrypt";
import { AuthRepository } from "../repositories/auth.repositories";
import { generateToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import type {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth.types";

const repo = new AuthRepository();
const SALT_ROUNDS = 10;

// Ne jamais renvoyer le hash au client
export const toPublicUser = ({ password, ...rest }: User) => rest;

export class AuthService {
  async register(data: RegisterRequest) {
    if (await repo.findUserByEmail(data.email)) {
      throw new AppError(409, "Email déjà utilisé");
    }
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await repo.createUser({ ...data, password: hashed });
    const token = generateToken({ id: user.id, role: user.role });
    return { token, user: toPublicUser(user) };
  }

  async login({ email, password }: LoginRequest) {
    const user = await repo.findUserByEmail(email);
    // Même message dans les deux cas pour ne pas révéler si l'email existe
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, "Identifiants invalides");
    }
    if (!user.isActive) throw new AppError(403, "Compte désactivé");
    const token = generateToken({ id: user.id, role: user.role });
    return { token, user: toPublicUser(user) };
  }

  async changePassword(
    userId: number,
    { currentPassword, newPassword }: ChangePasswordRequest,
  ) {
    const user = await repo.findUserById(userId);
    if (!user) throw new AppError(404, "Utilisateur introuvable");
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new AppError(400, "Mot de passe actuel incorrect");
    }
    await repo.updatePassword(
      userId,
      await bcrypt.hash(newPassword, SALT_ROUNDS),
    );
  }
}
