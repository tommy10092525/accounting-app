// `wrangler d1 migrations apply` はwrangler独自のマイグレーション管理形式を期待しており、
// drizzle-kitが `drizzle/` に出力するSQLファイルとは非互換のため使えない。
// 代わりにdrizzle-kitの生成したSQLファイルを番号順に直接流し込む。
// 実行: pnpm db:apply-local (ローカルD1のみ。リモートに当てる場合は各自 --remote で個別実行する)
// 冪等ではない(適用済みかどうかの記録を持たない)ので、既存テーブルがある状態で
// 再実行すると "table already exists" で失敗する。新規/リセット後のローカルD1にのみ使うこと。
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync("drizzle")
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("drizzle/ 配下にマイグレーションSQLが見つかりません");
  process.exit(1);
}

for (const file of files) {
  console.log(`▶ applying drizzle/${file}`);
  const result = spawnSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "accounting-app-d1", "--local", `--file=./drizzle/${file}`],
    { stdio: "inherit", shell: true },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
