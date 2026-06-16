import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../../../src/generated/prisma/client";

type PrismaTestDatabase = {
  client: PrismaClient;
  cleanup: () => Promise<void>;
};

// テスト用の一時DBを作る
const applyMigration = async (client: PrismaClient): Promise<void> => {
  const migrationSql = readFileSync(
    path.join(
      process.cwd(),
      "prisma/migrations/20260615065245_init/migration.sql",
    ),
    "utf8",
  );

  for (const statement of migrationSql.split(";")) {
    const sql = statement.trim();

    if (sql.length > 0) {
      await client.$executeRawUnsafe(sql);
    }
  }
};

export const createPrismaTestDatabase =
  async (): Promise<PrismaTestDatabase> => {
    // OS の一時ディレクトリ配下に、テスト専用のフォルダを作成
    const databaseDir = mkdtempSync(
      path.join(tmpdir(), "meeting-room-prisma-"),
    );
    // 一時フォルダ内の test.db に接続する PrismaClient を作成
    const client = new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: `file:${path.join(databaseDir, "test.db")}`,
      }),
    });

    await applyMigration(client);

    return {
      client,
      cleanup: async () => {
        await client.$disconnect();
        rmSync(databaseDir, { recursive: true, force: true });
      },
    };
  };
