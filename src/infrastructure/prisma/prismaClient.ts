import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const log =
  process.env.NODE_ENV === "development"
    ? ["query" as const, "info" as const, "warn" as const, "error" as const]
    : ["warn" as const, "error" as const];

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma = new PrismaClient({ adapter, log });
