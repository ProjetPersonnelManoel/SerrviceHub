import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import "dotenv/config";

// Les identifiants viennent uniquement du .env (jamais en dur dans le code)
const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} manquant dans le .env`);
}

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(connection, { schema, mode: "default" });

export const testConnection = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await connection.query("SELECT 1");
    // Vérifie que les migrations ont été appliquées
    const [tables] = await connection.query("SHOW TABLES LIKE ?", ["users"]);
    if (Array.isArray(tables) && tables.length === 0) {
      throw new Error("Table users does not exist in the database");
    }
    console.log("Database connection successful.");
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";
    console.error("Database connection failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
