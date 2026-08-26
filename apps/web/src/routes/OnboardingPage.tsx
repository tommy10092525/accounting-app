import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>サークルを作成</CardTitle>
          <CardDescription>会計を管理するサークルの名前を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="circle-name">サークル名</Label>
              <Input
                id="circle-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成する"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
