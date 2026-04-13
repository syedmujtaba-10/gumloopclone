import path from "node:path";
import { defineConfig } from "prisma/config";
import { config as dotenvConfig } from "dotenv";

// Load env files manually since Prisma config disables dotenv by default
dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
