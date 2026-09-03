import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

import Shonin from "@/components/images/承認待ち.svg"
import seisan from "@/components/images/立替精算アイコン.svg"
import daigakubetsuShosiki from "@/components/images/書式フォーマット.svg"
import sishutsutouroku from "@/components/images/支出登録アイコン.svg"
import shunyutouroku from "@/components/images/収入登録アイコン.svg"
import soushunyu from "@/components/images/総収入アイコン.svg"
import sousishutu from "@/components/images/総支出アイコン.svg"
import torihiki from "@/components/images/取引一覧アイコン.svg"
import Shutsuryoku from "@/components/images/会計出力アイコン.svg"
import settei from "@/components/images/設定アイコン.svg"
import sabusuku from "@/components/images/サブスク管理アイコン.svg"
import oshirase from "@/components/images/お知らせアイコン.svg"


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
  // 未精算 = 承認済みだが申請者への払い戻しが済んでいないもの
  const unpaidCount =
    reimbursements?.filter((r) => r.status === "approved").length ?? 0;

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
        <img src={Shonin}></img>
        <span className="font-medium">
          承認待ち <span className="text-destructive">{pendingCount}件</span>
        </span>
        <span className="text-xs text-primary underline">
          承認待ち一覧へ &gt;
        </span>
      </Link>
      <Link
        to="/dashboard/liquidation"
        className="flex items-center justify-between rounded-xl border-2 border-[#D7BC02] bg-card px-4 py-3"
      >
        <img src={seisan}></img>
        <span className="font-medium">
          承認待ち <span className="text-destructive">{pendingCount}件</span>
        </span>
        <span className="text-xs text-primary underline">
          承認待ち一覧へ &gt;
        </span>
      </Link>
      <Link
        to="#"
        className="border-green-500 border-2 rounded-xl px-4 py-3 bg-white flex items-center gap-2"
      >
        <img src={daigakubetsuShosiki}></img>
        大学別書式フォーマット登録（未） &gt;
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-3 border-brand-blue bg-card p-4">
          <div className="flex gap-2">
            <img src={soushunyu} className="size-12" alt="" />
            <div>
              <p className="text-lg font-semibold">総収入</p>
              <p className="text-lg font-semibold">
                {summary ? `¥${summary.income.toLocaleString()}` : "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border-3 border-brand-blue bg-card p-4 flex gap-2">
          <img src={sousishutu} alt="" className="size-12" />
          <div>
            <p className="text-lg font-semibold">総支出</p>
            <p className="mt-1 text-lg font-semibold">
              {summary ? `¥${summary.expense.toLocaleString()}` : "-"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border-3 border-brand-blue bg-card p-4 col-span-2">
          <p className="text-muted-foreground">収支</p>
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
            className="rounded-xl border-3 border-brand-blue text-brand-blue hover:text-brand-blue"
          >
            <Link to="/dashboard/expenses" className="flex-col block h-24">
              <img src={sishutsutouroku}/>
              支出登録
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-brand-green text-brand-green hover:text-brand-green"
            >
            <Link to="/dashboard/income" className="flex-col block h-24">
              <img src={shunyutouroku}/>
              収入登録
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-brand-lightblue text-brand-lightblue hover:text-brand-lightblue"
          >
            <Link to="/dashboard/transactions" className="flex-col block h-24">
              {/* <ListBulletsIcon
                className="bg-brand-lightblue text-white p-2 size-12 rounded-full"
                size={32}
              /> */}
              <img src={torihiki}/>
              収支一覧
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-brand-yellow text-brand-yellow hover:text-brand-yellow"
          >
            <Link to="#" className="flex-col block h-24">
              <img src={Shutsuryoku} className=""/>
              会計出力（未）
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-brand-lavender text-brand-lavender hover:text-brand-lavender"
          >
            <Link to="/dashboard/setting" className="flex-col block h-24">
              <img src={settei}/>
              設定
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-3 border-brand-pink text-brand-pink hover:text-brand-pink"
          >
            <Link to="/dashboard/subscription" className="flex-col block h-24">
              <img src={sabusuku}/>
              サブスク管理
            </Link>
          </Button>
        </div>
      </div>
      <div className="border-brand-blue border-2 rounded-lg p-4 bg-blue-100">
        <div className="flex gap-6 items-center ">
          {/* <MegaphoneIcon size={32} className="text-brand-blue rotate-y-180" /> */}
          <img src={oshirase}/>
          <h2 className="font-bold">お知らせ</h2>
        </div>
        <p>お知らせ１</p>
        <p>お知らせ１</p>
        <p>お知らせ１</p>
        <Link
          to={"#"}
          className="text-right text-brand-blue font-bold mt-4 block"
        >
          全て見る（未） &gt;
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
          <Link className="" to={"/rule"}>
            特定商取引法に基づく表記{"   "}
            <span className="text-brand-blue">&gt;</span>
          </Link>
        </li>
        <li className="">
          <Link className="" to={"/rule"}>利用規約{"   "}
          <span className="text-brand-blue">&gt;</span>
          </Link>
        </li>
        <li className="">
          <Link className="" to={"/rule"}>プライバシーポリシー{"   "}
          <span className="text-brand-blue">&gt;</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
