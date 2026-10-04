import type { Config } from "drizzle-kit";

const config: Config = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "manoel_hub",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "servicehub_api",
  },
};

module.exports = config;
