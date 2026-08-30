import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  CreditCardIcon,
  CurrencyJpyIcon,
  FileTextIcon,
  GearIcon,
  GridNineIcon,
  ListBulletsIcon,
  MegaphoneIcon,
  MicrosoftExcelLogoIcon,
  PlusIcon,
} from "@phosphor-icons/react";

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
  const pendingCount =
    reimbursements?.filter((r) => r.status === "pending").length ?? 0;

  const shareUrl = `${window.location.origin}/#/c/${circle.publicToken}`;

  async function handleCopyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">サマリー</h1>
      <Link
        to="/dashboard/reimbursements"
        className="flex items-center justify-between rounded-xl border-2 border-destructive/60 bg-card px-4 py-3"
      >
        <FileTextIcon
          size={32}
          className="rounded-full bg-red-500 text-white size-14 p-2"
        />
        <span className="font-medium">
          承認待ち <span className="text-destructive">{pendingCount}件</span>
        </span>
        <span className="text-xs text-primary underline">
          承認待ち一覧へ &gt;
        </span>
      </Link>
      <Link
        to="#"
        className="border-green-500 border-2 rounded-xl px-4 py-3 bg-white flex items-center"
      >
        <GridNineIcon size={32} className="text-green-500" />
        大学別書式フォーマット登録 &gt;
      </Link>
      <Link
        to="#"
        className="border-purple-400 border-2 rounded-xl px-4 py-3 bg-white flex items-center"
      >
        <MicrosoftExcelLogoIcon size={32} className="text-purple-400" />
        会計詳細の出力
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-3 border-brand-blue bg-card p-4">
          <p className="text-xs text-muted-foreground">総収入</p>
          <p className="mt-1 text-lg font-semibold">
            {summary ? `¥${summary.income.toLocaleString()}` : "-"}
          </p>
        </div>
        <div className="rounded-xl border-3 border-brand-blue bg-card p-4">
          <p className="text-xs text-muted-foreground">総支出</p>
          <p className="mt-1 text-lg font-semibold">
            {summary ? `¥${summary.expense.toLocaleString()}` : "-"}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border-3 border-brand-blue bg-card p-4">
          <p className="text-xs text-muted-foreground">収支</p>
          <p className="mt-1 text-lg font-semibold">
            {summary ? `¥${summary.balance.toLocaleString()}` : "-"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-medium">クイックアクション</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-brand-blue text-brand-blue"
          >
            <Link to="/dashboard/expenses" className="flex-col block h-24">
              <PlusIcon
                size={32}
                className="bg-brand-blue text-white p-2 size-12 rounded-full"
              />
              支出登録
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-green-500 text-green-500"
          >
            <Link to="/dashboard/expenses" className="flex-col block h-24">
              <PlusIcon
                size={32}
                className="bg-green-500 text-white p-2 size-12 rounded-full"
              />
              支出登録
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-sky-500 text-sky-500"
          >
            <Link to="/dashboard/expenses" className="flex-col block h-24">
              <ListBulletsIcon
                className="bg-sky-500 text-white p-2 size-12 rounded-full"
                size={32}
              />
              取引
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-yellow-500 text-yellow-500"
          >
            <Link to="/dashboard/expenses" className="flex-col block h-24">
              <CurrencyJpyIcon
                size={32}
                className="bg-yellow-500 text-white p-2 size-12 rounded-full"
              />
              会計出力
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-purple-400 text-purple-400"
          >
            <Link to="/dashboard/setting" className="flex-col block h-24">
              <GearIcon
                size={32}
                className="bg-purple-400 text-white p-2 size-12 rounded-full"
              />
              設定
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-pink-400 text-pink-400"
          >
            <Link to="/dashboard/subscription" className="flex-col block h-24">
              <CreditCardIcon
                size={32}
                className="bg-pink-400 text-white p-2 size-12 rounded-full"
              />
              サブスク管理
            </Link>
          </Button>
        </div>
      </div>
      <div className="border-brand-blue border-2 rounded-lg p-4 bg-blue-100">
        <div className="flex gap-6 items-center ">
          <MegaphoneIcon size={32} className="text-brand-blue rotate-y-180" />
          <h2 className="font-bold">お知らせ</h2>
        </div>
        <p>お知らせ１</p>
        <p>お知らせ１</p>
        <p>お知らせ１</p>
        <Link
          to={"#"}
          className="text-right text-brand-blue font-bold mt-4 block"
        >
          全て見る &gt;
        </Link>
      </div>
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          立替申請の共有URL
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
            {shareUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareUrl}
          >
            {copied ? "コピーしました" : "コピー"}
          </Button>
        </div>
      </div>
      <ul className="list-disc list-inside marker:text-brand-blue">
        <li className="">
          <Link className="" to={""}>
            特定商取引法に基づく表記{"   "}
            <span className="text-brand-blue">&gt;</span>
          </Link>
        </li>
        <li className="">
          <Link className="" to={""}>利用規約{"   "}
          <span className="text-brand-blue">&gt;</span>
          </Link>
        </li>
        <li className="">
          <Link className="" to={""}>プライバシーポリシー{"   "}
          <span className="text-brand-blue">&gt;</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
