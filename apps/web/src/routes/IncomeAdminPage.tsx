import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IncomeAdminPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: rows, isPending } = useQuery({
    queryKey: ["admin", "income"],
    queryFn: async () => {
      const res = await apiClient.api.admin.income.$get();
      if (!res.ok) throw new Error("収入の取得に失敗しました");
      return res.json();
    },
  });

  function refetchAll() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "income"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const res = await apiClient.api.admin.income.$post({
      json: { amount: Number(amount), description, occurredOn: occurredOn || undefined },
    });

    if (!res.ok) {
      setError("登録に失敗しました");
      return;
    }

    setAmount("");
    setDescription("");
    setOccurredOn("");
    refetchAll();
  }

  async function handleDelete(id: string) {
    const res = await apiClient.api.admin.income[":id"].$delete({ param: { id } });
    if (res.ok) refetchAll();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center">収入登録</h1>
      <div>
        <form className="mt-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="income-description">
              収入内容 <span className="ml-1 text-xs text-primary">必須</span>
            </Label>
            <Input
              id="income-description"
              required
              placeholder="テキストを入力"
              className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="income-amount">
              金額 <span className="ml-1 text-xs text-primary">必須</span>
            </Label>
            <Input
              id="income-amount"
              type="number"
              min={1}
              required
              placeholder="¥0"
              className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="income-date">
              入金日 <span className="ml-1 text-xs text-primary">必須</span>
            </Label>
            <Input
              id="income-date"
              type="date"
              required
              className="mt-2 h-12 rounded-xl border-2 border-brand-blue"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-8 flex items-center">
            <Button className="mx-auto rounded-full px-8 py-2 text-lg" type="submit">
              登録
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">登録済みの収入</h2>
        {!isPending && rows?.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">収入記録はまだありません。</p>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {rows?.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-xl border-2 border-brand-blue/40 bg-card px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {row.description} — ¥{row.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(row.occurredOn).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                削除
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
