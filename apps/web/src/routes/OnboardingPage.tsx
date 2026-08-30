import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Wrapper from "@/components/Wrapper";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await apiClient.api.circles.$post({ json: { name } });

    setIsSubmitting(false);

    if (!res.ok) {
      setError("サークルの作成に失敗しました");
      return;
    }

    void navigate("/dashboard");
  }

  return (
    <Wrapper>
      <h1 className="text-center text-2xl font-bold">サークルを作成</h1>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        会計を管理するサークルの名前を入力してください
      </p>
      <form className="mt-8" onSubmit={handleSubmit}>
        <Label htmlFor="circle-name">
          サークル名 <span className="ml-1 text-xs text-primary">必須</span>
        </Label>
        <Input
          id="circle-name"
          required
          className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-8 flex items-center">
          <Button
            className="mx-auto rounded-full px-8 py-2 text-lg"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "作成中..." : "作成する"}
          </Button>
        </div>
      </form>
    </Wrapper>
  );
}
