import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import searchIcon from "@/components/images/Search_Icon.svg";

type SortKey = "new" | "old" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "new", label: "新しい順" },
  { key: "old", label: "古い順" },
  { key: "amount-desc", label: "大きい金額" },
  { key: "amount-asc", label: "小さい金額" },
];

export function ReimbursementsAdminPage() {
  const queryClient = useQueryClient();
  const [showApproved, setShowApproved] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const { data: reimbursements, isPending } = useQuery({
    queryKey: ["admin", "reimbursements"],
    queryFn: async () => {
      const res = await apiClient.api.admin.reimbursements.$get();
      if (!res.ok) throw new Error("立替申請の取得に失敗しました");
      return res.json();
    },
  });

  function refetchAll() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "reimbursements"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
  }

  const filtered = useMemo(() => {
    if (!reimbursements) return [];
    let rows = reimbursements.filter((r) =>
      showApproved ? r.status !== "pending" : r.status === "pending",
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) => r.payerName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
      );
    }
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "new":
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case "old":
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
      }
    });
    return rows;
  }, [reimbursements, showApproved, search, sort]);

  const selected = reimbursements?.find((r) => r.id === selectedId) ?? null;

  async function openDetail(id: string) {
    setSelectedId(id);
    setReceiptUrl(null);
    const res = await apiClient.api.admin.reimbursements[":id"].receipt.$get({ param: { id } });
    if (res.ok) {
      const blob = await res.blob();
      setReceiptUrl(URL.createObjectURL(blob));
    }
  }

  function closeDetail() {
    setSelectedId(null);
    setReceiptUrl(null);
  }

  async function handleApprove(id: string) {
    const res = await apiClient.api.admin.reimbursements[":id"].approve.$post({ param: { id } });
    if (res.ok) {
      refetchAll();
      closeDetail();
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("却下理由(任意)") ?? "";
    const res = await apiClient.api.admin.reimbursements[":id"].reject.$post({
      param: { id },
      json: { reason },
    });
    if (res.ok) {
      refetchAll();
      closeDetail();
    }
  }

  if (isPending) return null;

  if (selected) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-xl font-bold">登録内容の確認</h2>
        <div className="rounded-2xl border-2 border-brand-blue bg-card p-6">
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">件名</dt>
              <dd className="mt-1 border-b pb-2 font-medium">{selected.title}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">支払者</dt>
              <dd className="mt-1 border-b pb-2 font-medium">{selected.payerName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">金額</dt>
              <dd className="mt-1 border-b pb-2 font-medium">
                ¥{selected.amount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">レシート画像</dt>
              <dd className="mt-2">
                {receiptUrl ? (
                  <img
                    src={receiptUrl}
                    alt="レシート"
                    className="max-h-80 w-full rounded-lg border object-contain"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                    読み込み中...
                  </div>
                )}
              </dd>
            </div>
            {selected.memo && (
              <div>
                <dt className="text-sm text-muted-foreground">メモ</dt>
                <dd className="mt-1 border-b pb-2">{selected.memo}</dd>
              </div>
            )}
            {selected.status === "rejected" && selected.rejectionReason && (
              <div>
                <dt className="text-sm text-muted-foreground">却下理由</dt>
                <dd className="mt-1 text-destructive">{selected.rejectionReason}</dd>
              </div>
            )}
          </dl>
        </div>
        {selected.status === "pending" ? (
          <div className="flex justify-center gap-4">
            <Button
              className="rounded-full bg-green-600 px-12 hover:bg-green-600/90"
              onClick={() => handleApprove(selected.id)}
            >
              承認
            </Button>
            <Button variant="destructive" className="rounded-full px-12" onClick={() => handleReject(selected.id)}>
              却下
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button variant="outline" className="rounded-full px-6" onClick={closeDetail}>
              一覧に戻る
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center">立て替え申請</h1>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{showApproved ? "承認済み一覧" : "承認待ち一覧"}</h2>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => setShowApproved((v) => !v)}
        >
          {showApproved ? "承認待ち一覧 >" : "承認済み一覧 >"}
        </button>
      </div>

      <div className="relative">
        <img src={searchIcon} alt="" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
        <Input
          placeholder="検索"
          className="h-10 rounded-full border-2 border-brand-blue pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSort(option.key)}
            className={
              sort === option.key
                ? "rounded-full bg-brand-blue px-3 py-1 text-xs font-medium text-white"
                : "rounded-full border px-3 py-1 text-xs text-muted-foreground bg-card"
            }
          >
            ↓{option.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">該当する立替申請はありません。</p>
        )}
        {filtered.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => openDetail(r.id)}
            className="flex items-center justify-between rounded-xl border-2 border-brand-blue/40 bg-card px-4 py-3 text-left"
          >
            <div>
              <p className="font-bold text-xl">{r.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.payerName} / {new Date(r.submittedAt).toLocaleString("ja-JP")}
              </p>
              <p className="mt-1 font-medium">¥{r.amount.toLocaleString()}</p>
            </div>
            <span
              className={
                r.status === "pending"
                  ? "text-sm font-medium text-destructive"
                  : r.status === "approved"
                    ? "text-sm font-medium text-green-600"
                    : "text-sm font-medium text-muted-foreground"
              }
            >
              {r.status === "pending" ? "未承認" : r.status === "approved" ? "承認済み" : "却下"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
