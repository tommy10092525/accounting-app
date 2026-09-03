import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Input } from "@/components/ui/input";
import searchIcon from "@/components/images/Search_Icon.svg";

type SortKey = "new" | "old" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "new", label: "新しい順" },
  { key: "old", label: "古い順" },
  { key: "amount-desc", label: "大きい金額" },
  { key: "amount-asc", label: "小さい金額" },
];

const LiquidationAdminPage = () => {
  const queryClient = useQueryClient();
  const [showPaid, setShowPaid] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("new");

  const { data: reimbursements, isPending } = useQuery({
    queryKey: ["admin", "reimbursements"],
    queryFn: async () => {
      const res = await apiClient.api.admin.reimbursements.$get();
      if (!res.ok) throw new Error("立替申請の取得に失敗しました");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    if (!reimbursements) return [];
    // 未精算 = 承認済みだが払い戻しが済んでいないもの
    let rows = reimbursements.filter((r) => (showPaid ? r.status === "paid" : r.status === "approved"));

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) => r.payerName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
      );
    }

    return [...rows].sort((a, b) => {
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
  }, [reimbursements, showPaid, search, sort]);

  const total = filtered.reduce((sum, r) => sum + r.amount, 0);

  async function handleMarkPaid(id: string) {
    const res = await apiClient.api.admin.reimbursements[":id"].paid.$post({ param: { id } });
    if (res.ok) {
      void queryClient.invalidateQueries({ queryKey: ["admin", "reimbursements"] });
    }
  }

  if (isPending) return null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-center text-2xl font-bold">{showPaid ? "精算済み一覧" : "未精算一覧"}</h1>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {showPaid ? "精算済み" : "未精算"}合計 &yen;{total.toLocaleString()}
        </p>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => setShowPaid((v) => !v)}
        >
          {showPaid ? "未精算一覧 >" : "精算済み一覧 >"}
        </button>
      </div>

      <div className="relative">
        <img
          src={searchIcon}
          alt=""
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50"
        />
        <Input
          placeholder="検索"
          className="h-10 rounded-full border-2 border-brand-blue bg-card pl-9"
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
                : "rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
            }
          >
            ↓{option.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {showPaid ? "精算済みの立替はありません。" : "未精算の立替はありません。"}
          </p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border-2 border-brand-blue bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-lg font-bold">
                {r.payerName}
                <span className="ml-3 font-medium">&yen;{r.amount.toLocaleString()}</span>
              </p>
              <span
                className={
                  r.status === "paid"
                    ? "shrink-0 text-sm font-medium text-brand-green"
                    : "shrink-0 text-sm font-medium text-destructive"
                }
              >
                {r.status === "paid" ? "精算済み" : "未精算"}
              </span>
            </div>
            <p className="mt-1 text-sm">{r.title}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {new Date(r.submittedAt).toLocaleString("ja-JP")}
              </p>
              {r.status === "approved" && (
                <button
                  type="button"
                  onClick={() => handleMarkPaid(r.id)}
                  className="rounded-md bg-brand-green px-4 py-2 text-sm font-bold text-white"
                >
                  精算済みにする
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiquidationAdminPage;
