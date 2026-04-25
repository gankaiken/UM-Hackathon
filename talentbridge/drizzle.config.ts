import { Config } from "drizzle-kit";

export default {
  dialect: 'sqlite',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
} satisfies Config;
