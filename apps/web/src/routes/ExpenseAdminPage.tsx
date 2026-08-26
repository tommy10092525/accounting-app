import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExpenseAdminPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: rows, isPending } = useQuery({
    queryKey: ["admin", "expenses"],
    queryFn: async () => {
      const res = await apiClient.api.admin.expenses.$get();
      if (!res.ok) throw new Error("支出の取得に失敗しました");
      return res.json();
    },
  });

  function refetchAll() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "expenses"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const res = await apiClient.api.admin.expenses.$post({
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
    const res = await apiClient.api.admin.expenses[":id"].$delete({ param: { id } });
    if (res.ok) refetchAll();
  }

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-wrap items-end gap-3 rounded-md border p-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-amount">金額(円)</Label>
          <Input
            id="expense-amount"
            type="number"
            min={1}
            required
            className="w-32"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-description">内容</Label>
          <Input
            id="expense-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-date">日付</Label>
          <Input
            id="expense-date"
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
          />
        </div>
        <Button type="submit">追加</Button>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </form>

      {!isPending && rows?.length === 0 && (
        <p className="text-sm text-muted-foreground">支出記録はまだありません。</p>
      )}
      <div className="flex flex-col gap-2">
        {rows?.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">
                {row.description} — ¥{row.amount.toLocaleString()}
                {row.source === "reimbursement" && (
                  <span className="ml-2 text-xs text-muted-foreground">(立替由来)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(row.occurredOn).toLocaleDateString("ja-JP")}
              </p>
            </div>
            {row.source === "manual" && (
              <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                削除
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
