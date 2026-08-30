import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Circle = { name: string; publicToken: string };

export function DashboardSummaryPage() {
  const { circle } = useOutletContext<{ circle: Circle }>();
  const [copied, setCopied] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: async () => {
      const res = await apiClient.api.admin.summary.$get();
      if (!res.ok) throw new Error("サマリーの取得に失敗しました");
      return res.json();
    },
  });

  const { data: reimbursements } = useQuery({
    queryKey: ["admin", "reimbursements"],
    queryFn: async () => {
      const res = await apiClient.api.admin.reimbursements.$get();
      if (!res.ok) throw new Error("立替申請の取得に失敗しました");
      return res.json();
    },
  });
  const pendingCount = reimbursements?.filter((r) => r.status === "pending").length ?? 0;

  const shareUrl = `${window.location.origin}/#/c/${circle.publicToken}`;

  async function handleCopyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/dashboard/reimbursements"
        className="flex items-center justify-between rounded-xl border-2 border-destructive/60 bg-card px-4 py-3"
      >
        <span className="font-medium text-destructive">承認待ち {pendingCount}件</span>
        <span className="text-xs text-primary underline">承認待ち一覧へ &gt;</span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-brand-blue/40 bg-card p-4">
          <p className="text-xs text-muted-foreground">総収入</p>
          <p className="mt-1 text-lg font-semibold">
            {summary ? `¥${summary.income.toLocaleString()}` : "-"}
          </p>
        </div>
        <div className="rounded-xl border-2 border-brand-blue/40 bg-card p-4">
          <p className="text-xs text-muted-foreground">総支出</p>
          <p className="mt-1 text-lg font-semibold">
            {summary ? `¥${summary.expense.toLocaleString()}` : "-"}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border-2 border-brand-blue/40 bg-card p-4">
          <p className="text-xs text-muted-foreground">収支</p>
          <p className="mt-1 text-lg font-semibold">
            {summary ? `¥${summary.balance.toLocaleString()}` : "-"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">クイックアクション</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-12 rounded-xl border-2 border-brand-blue">
            <Link to="/dashboard/expenses">支出登録</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-xl border-2 border-brand-blue">
            <Link to="/dashboard/income">収入登録</Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">立替申請の共有URL</h2>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
            {shareUrl}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyShareUrl}>
            {copied ? "コピーしました" : "コピー"}
          </Button>
        </div>
      </div>
    </div>
  );
}
