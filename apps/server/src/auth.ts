import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "./db";

// Cloudflare Workersはbinding(env)がリクエスト単位でしか取得できないため、
// better-authのインスタンスはモジュールスコープでシングルトン化せず、
// リクエストごとに c.env から作り直す(公式のHono+Cloudflare向けパターン)。
export function createAuth(env: Env) {
  const db = createDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await env.EMAIL.send({
          to: user.email,
          from: env.EMAIL_FROM_ADDRESS,
          subject: "【サークル会計アプリ】メールアドレスの確認",
          text: `以下のリンクからメールアドレスの確認を完了してください。\n\n${url}\n\nこのメールに心当たりがない場合は破棄してください。`,
          html: `<p>以下のリンクからメールアドレスの確認を完了してください。</p><p><a href="${url}">${url}</a></p><p>このメールに心当たりがない場合は破棄してください。</p>`,
        });
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

// 保護ルートで現在のセッションを取得するための共通ヘルパー
export function getSession(env: Env, request: Request) {
  return createAuth(env).api.getSession({ headers: request.headers });
}
