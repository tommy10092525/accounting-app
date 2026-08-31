import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import photoIcon from "@/components/images/photo_Icon.svg";

const FIELD_CLASS = "mt-2 h-12 rounded-xl border-2 border-brand-blue bg-card";
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024; // 10MB

export function IncomeAdminPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_RECEIPT_BYTES) {
      setError("画像は10MB以内にしてください");
      setReceipt(null);
      event.target.value = "";
      return;
    }
    setError(null);
    setReceipt(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // 画像を含むため multipart/form-data。この形式のルートはRPCクライアントに
    // 入力型が乗らないため、素のfetchで送信する。
    const formData = new FormData();
    formData.set("description", description);
    formData.set("amount", amount);
    formData.set("occurredOn", occurredOn);
    if (receipt) formData.set("receipt", receipt);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/income`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setError("登録に失敗しました");
      return;
    }

    setAmount("");
    setDescription("");
    setOccurredOn("");
    setReceipt(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    refetchAll();
  }

  async function handleDelete(id: string) {
    const res = await apiClient.api.admin.income[":id"].$delete({ param: { id } });
    if (res.ok) refetchAll();
  }

  async function handleViewReceipt(id: string) {
    const res = await apiClient.api.admin.income[":id"].receipt.$get({ param: { id } });
    if (!res.ok) return;
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-center text-2xl font-bold">収入登録</h1>
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
              className={FIELD_CLASS}
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
              className={FIELD_CLASS}
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
              className={FIELD_CLASS}
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="income-receipt">
              画像アップロード <span className="ml-1 text-xs text-muted-foreground">任意</span>
            </Label>
            <input
              ref={fileInputRef}
              id="income-receipt"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-medium text-white"
            >
              <img src={photoIcon} alt="" className="size-5" />
              {receipt ? receipt.name : "ファイルを選択"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-8 flex items-center">
            <Button
              className="mx-auto rounded-full px-8 py-2 text-lg"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "登録中..." : "登録"}
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
              <div className="flex shrink-0 items-center gap-1">
                {row.receiptImageKey && (
                  <Button variant="outline" size="sm" onClick={() => handleViewReceipt(row.id)}>
                    画像
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                  削除
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
