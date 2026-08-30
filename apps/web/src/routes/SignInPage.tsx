import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Wrapper from "@/components/Wrapper";
import eyeIcon from "@/components/images/Eye_Icon.svg";
import { Checkbox } from "@/components/ui/checkbox";

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified =
    searchParams.get("verified") === "1" && !searchParams.get("error");
  const verificationError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    verificationError
      ? "確認リンクが無効か期限切れです。もう一度登録してください。"
      : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message ?? "ログインに失敗しました");
      return;
    }

    void navigate("/dashboard");
  }
  return (
    <Wrapper>
      <h1 className="text-center text-2xl font-bold">ログイン</h1>
      {justVerified && (
        <p className="mt-4 text-center text-xs">
          メールアドレスの確認が完了しました。
          <br />
          ログインしてください。
        </p>
      )}
      <form className="mt-8" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            required
            className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="mt-6">
          <Label htmlFor="password">パスワード</Label>
          <div className="relative mt-2">
            <Input
              id="password"
              className="h-12 rounded-xl border-2 border-brand-blue pr-11"
              type={isPasswordVisible ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={
                isPasswordVisible ? "パスワードを隠す" : "パスワードを表示"
              }
              onClick={() => setIsPasswordVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <img src={eyeIcon} alt="" className="size-5 opacity-60" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center mt-2">
          <Checkbox
            className="data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue"
            onCheckedChange={() => setRememberMe((v) => !v)}
            checked={rememberMe}
            id="rememberMe"
          />
          <Label htmlFor="rememberMe">ログイン状態を保持する</Label>
        </div>
        {error && (
          <p className="mt-2 text-center text-xs text-destructive">{error}</p>
        )}
        <div className="mt-8 flex items-center">
          <Button
            className="mx-auto rounded-full px-8 py-2 text-lg"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </div>
      </form>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link to="/signup" className="text-xs text-primary underline">
          新規登録はこちら
        </Link>
        {/* パスワード再設定フローは未実装のため、現時点ではリンクにしていません */}
        <span className="text-xs text-muted-foreground">
          パスワードを忘れた方はこちら(準備中)
        </span>
      </div>
    </Wrapper>
  );
}
