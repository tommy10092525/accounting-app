import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Wrapper from "@/components/Wrapper";

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified =
    searchParams.get("verified") === "1" && !searchParams.get("error");
  const verificationError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message ?? "ログインに失敗しました");
      return;
    }

    void navigate("/dashboard");
  }

  return (
    <div>
      <Wrapper>
        <h1 className="text-2xl font-bold text-center m-16">ログイン</h1>
        {justVerified && (
          <p className="text-xs text-center mb-2">
            メールアドレスの確認が完了しました。
            <br />
            ログインしてください。
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              className="border-2 rounded-xl border-primary h-12 mt-2"
              value={email}
              onChange={(e) => {
                setEmail(() => e.target.value);
              }}
            />
          </div>
          <div className="mt-8">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              className="border-2 rounded-xl border-primary h-12 mt-2"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>
          <div className="mt-8 flex items-center">
            <Button
              className="rounded-full text-lg bg-[#FF506A] hover:bg-[#FF506A] py-2 px-8 mx-auto hover:ring-3 ring-[#FF506A]/50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>
          </div>
          {error && (
            <p className="text-xs font-thin text-red-500 text-center mt-2">
              メールアドレスかパスワードが違います
            </p>
          )}
        </form>
        <div className="flex flex-col gap-4 mt-4">
          <Link to="/signup" className="text-primary underline text-xs">
            新規登録はこちら
          </Link>
          <Link to="/signup" className="text-primary underline text-xs">
            パスワードが思い出せない場合
          </Link>
        </div>
      </Wrapper>
    </div>
  );
}
