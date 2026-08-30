// better-authの`user`テーブルに追加するアプリ固有のフィールド。
// 実行時の設定(src/auth.ts)とスキーマ生成用の設定(auth-schema-gen.config.ts)の
// 双方から参照して、定義が二重管理になるのを防ぐ。
// `as const` を外すと `type` が string 型に広がって DBFieldType に代入できなくなるので注意。
export const userAdditionalFields = {
  // サークル代表者の電話番号。
  // 会員登録フォームでは必須だが、ここを required: true にすると NOT NULL 列が生成され、
  // 既にユーザー行があるDBへのマイグレーションが制約違反で失敗する。
  // そのためDB上はnullable(既存ユーザーはnull)とし、必須検証は
  // src/routes/signup.ts のzodスキーマ側で担保する。
  phoneNumber: { type: "string", required: false },
} as const;
