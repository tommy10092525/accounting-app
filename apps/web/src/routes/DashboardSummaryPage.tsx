import { useState } from "react";
import { useOutletContext } from "react-router-dom";
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

  const shareUrl = `${window.location.origin}/#/c/${circle.publicToken}`;

  async function handleCopyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-sm font-medium">立替申請の共有URL</h2>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
            {shareUrl}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyShareUrl}>
            {copied ? "コピーしました" : "コピー"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium">収支サマリー</h2>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">収入合計</p>
            <p className="mt-1 text-lg font-semibold">
              {summary ? `¥${summary.income.toLocaleString()}` : "-"}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">支出合計</p>
            <p className="mt-1 text-lg font-semibold">
              {summary ? `¥${summary.expense.toLocaleString()}` : "-"}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">収支</p>
            <p className="mt-1 text-lg font-semibold">
              {summary ? `¥${summary.balance.toLocaleString()}` : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
