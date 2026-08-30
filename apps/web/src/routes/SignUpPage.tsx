import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Wrapper from "@/components/Wrapper";

export function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${window.location.origin}/login?verified=1`,
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message ?? "登録に失敗しました");
      return;
    }

    setIsSent(true);
  }

  return (
    <Wrapper>
      <h1 className="text-2xl font-bold text-center m-16">新規登録</h1>
      <p className="text-center mb-8 text-sm">
        お使いのメールアドレス宛に確認メールを送信します
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name">お名前</Label>
          <Input
            id="name"
            className="border-2 rounded-xl border-primary h-12 mt-2"
            value={name}
            onChange={(e) => {
              setName(() => e.target.value);
            }}
          />
        </div>
        <div className="mt-8">
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
            {isSubmitting ? "登録中..." : "登録する"}
          </Button>
        </div>
        {isSent && <p className="text-center text-sm mt-4">{email} 宛てにメールを送信しました。<br/>メール内のリンクを開いて登録を完了してください。</p>}
        {error && (
          <p className="text-xs font-thin text-red-500 text-center mt-2">
            メールアドレスかパスワードが違います
          </p>
        )}
      </form>
    </Wrapper>
  );
}
