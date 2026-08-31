import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Wrapper from "@/components/Wrapper";

const FIELD_CLASS = "mt-2 h-12 rounded-xl border-2 border-brand-blue bg-card";

export function ResetPasswordPage() {
  // メールのリンクは `/#/reset-password?token=xxx` の形で組んでいるため、
  // トークンはハッシュ内のクエリに入る(= useSearchParams で読める)。
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setError(null);

    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }

    setIsSubmitting(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setIsSubmitting(false);

    if (resetError) {
      // 期限切れ・使用済みトークンもここに来る
      setError(
        "パスワードを再設定できませんでした。リンクの有効期限が切れているか、既に使用済みの可能性があります。",
      );
      return;
    }

    setIsDone(true);
  }

  if (!token) {
    return (
      <Wrapper>
        <h1 className="text-center text-2xl font-bold">リンクが正しくありません</h1>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          メールに記載されたリンクをもう一度お試しください。
        </p>
        <div className="mt-8 grid">
          <Link
            to="/forgot-password"
            className="w-full text-center text-sm font-thin text-brand-blue underline"
          >
            再設定メールを送り直す
          </Link>
        </div>
      </Wrapper>
    );
  }

  if (isDone) {
    return (
      <Wrapper>
        <h1 className="text-center text-2xl font-bold">パスワードを変更しました</h1>
        <p className="mt-6 text-center text-sm">新しいパスワードでログインしてください。</p>
        <div className="mt-8 flex items-center">
          <Button asChild className="mx-auto rounded-full px-8 py-2 text-lg">
            <Link to="/login">ログインへ</Link>
          </Button>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 className="text-center text-2xl font-bold">新しいパスワードの設定</h1>
      <form className="mt-8" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="password">
            新しいパスワード <span className="ml-1 text-xs text-primary">必須</span>
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            placeholder="8文字以上"
            className={FIELD_CLASS}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-6">
          <Label htmlFor="password-confirm">
            新しいパスワード(確認) <span className="ml-1 text-xs text-primary">必須</span>
          </Label>
          <Input
            id="password-confirm"
            type="password"
            required
            minLength={8}
            placeholder="もう一度入力"
            className={FIELD_CLASS}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>
        {error && (
          <div className="mt-4">
            <p className="text-center text-xs text-destructive">{error}</p>
            <div className="mt-2 grid">
              <Link
                to="/forgot-password"
                className="w-full text-center text-xs text-brand-blue underline"
              >
                再設定メールを送り直す
              </Link>
            </div>
          </div>
        )}
        <div className="mt-8 flex items-center">
          <Button
            className="mx-auto rounded-full px-8 py-2 text-lg"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "変更中..." : "変更する"}
          </Button>
        </div>
      </form>
    </Wrapper>
  );
}
