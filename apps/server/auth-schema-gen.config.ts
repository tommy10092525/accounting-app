// better-authのCLI(`generate`)でsrc/db/auth-schema.tsを再生成するための専用設定。
// D1バインディングはNode.js(CLI実行環境)からは使えないため、ダミーのdrizzleクライアントを渡す。
// 実際にクエリを実行するわけではなく、スキーマ構造の静的な導出にのみ使われる。
// 実行: pnpm auth:generate-schema
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { userAdditionalFields } from "./src/auth-fields";

export const auth = betterAuth({
  database: drizzleAdapter(drizzle({} as unknown as D1Database), {
    provider: "sqlite",
  }),
  user: { additionalFields: userAdditionalFields },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
});
