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
      <h1 className="text-center text-2xl font-bold">新規登録</h1>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        お使いのメールアドレス宛に確認メールを送信します
      </p>
      <form className="mt-8" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name">
            お名前 <span className="ml-1 text-xs text-primary">必須</span>
          </Label>
          <Input
            id="name"
            required
            className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mt-6">
          <Label htmlFor="email">
            メールアドレス <span className="ml-1 text-xs text-primary">必須</span>
          </Label>
          <Input
            id="email"
            type="email"
            required
            className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-6">
          <Label htmlFor="password">
            パスワード <span className="ml-1 text-xs text-primary">必須</span>
          </Label>
          <Input
            id="password"
            className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-8 flex items-center">
          <Button
            className="mx-auto rounded-full px-8 py-2 text-lg"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "登録中..." : "登録する"}
          </Button>
        </div>
        {isSent && (
          <p className="mt-4 text-center text-sm">
            {email} 宛てにメールを送信しました。
            <br />
            メール内のリンクを開いて登録を完了してください。
          </p>
        )}
        {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
      </form>
    </Wrapper>
  );
}
