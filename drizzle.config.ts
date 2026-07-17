import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./netlify/db/schema.ts",
  out: "./netlify/db/migrations",
  dialect: "postgresql",
});
