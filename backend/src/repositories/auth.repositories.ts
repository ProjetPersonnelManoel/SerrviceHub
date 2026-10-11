import { db } from "../db/connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { RegisterRequest, User } from "../types/auth.types";

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user[0] || null;
  }

  async findUserById(id: number): Promise<User | null> {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user[0] || null;
  }

  async createUser(
    data: RegisterRequest & { password: string },
  ): Promise<User> {
    const [result] = await db.insert(users).values(data).$returningId();
    const user = await this.findUserById(result.id);
    if (!user) throw new Error("Failed to create user");
    return user;
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }
}
