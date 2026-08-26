import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
};

export function ReimbursementsAdminPage() {
  const queryClient = useQueryClient();

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

  async function handleApprove(id: string) {
    const res = await apiClient.api.admin.reimbursements[":id"].approve.$post({
      param: { id },
    });
    if (res.ok) refetchAll();
  }

  async function handleReject(id: string) {
    const reason = window.prompt("却下理由(任意)") ?? "";
    const res = await apiClient.api.admin.reimbursements[":id"].reject.$post({
      param: { id },
      json: { reason },
    });
    if (res.ok) refetchAll();
  }

  async function handleViewReceipt(id: string) {
    const res = await apiClient.api.admin.reimbursements[":id"].receipt.$get({
      param: { id },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  }

  if (isPending) return null;

  return (
    <div className="flex flex-col gap-4">
      {reimbursements?.length === 0 && (
        <p className="text-sm text-muted-foreground">立替申請はまだありません。</p>
      )}
      {reimbursements?.map((r) => (
        <div key={r.id} className="rounded-md border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">
                {r.payerName} — ¥{r.amount.toLocaleString()}
              </p>
              {r.memo && <p className="mt-1 text-sm text-muted-foreground">{r.memo}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {STATUS_LABEL[r.status]} / {new Date(r.submittedAt).toLocaleString("ja-JP")}
              </p>
              {r.status === "rejected" && r.rejectionReason && (
                <p className="mt-1 text-xs text-destructive">理由: {r.rejectionReason}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleViewReceipt(r.id)}>
                レシートを見る
              </Button>
              {r.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => handleApprove(r.id)}>
                    承認
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleReject(r.id)}>
                    却下
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
