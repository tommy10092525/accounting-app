import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import searchIcon from "@/components/images/Search_Icon.svg";

type SortKey = "new" | "old" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "new", label: "新しい順" },
  { key: "old", label: "古い順" },
  { key: "amount-desc", label: "大きい金額" },
  { key: "amount-asc", label: "小さい金額" },
];

// 収入・支出どちらのレコードもこの形を満たすので、両方を同じ処理で絞り込める
type Transaction = {
  id: string;
  description: string;
  amount: number;
  occurredOn: string;
};

function filterAndSort<T extends Transaction>(rows: T[], search: string, sort: SortKey): T[] {
  let result = rows;

  const q = search.trim().toLowerCase();
  if (q) result = result.filter((row) => row.description.toLowerCase().includes(q));

  return [...result].sort((a, b) => {
    switch (sort) {
      case "new":
        return new Date(b.occurredOn).getTime() - new Date(a.occurredOn).getTime();
      case "old":
        return new Date(a.occurredOn).getTime() - new Date(b.occurredOn).getTime();
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
    }
  });
}

const TransactionsAdminPage = () => {
  const tabsTriggerStyle =
    "data-[state=active]:bg-brand-blue data-[state=active]:text-white text-brand-blue rounded-md";

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("new");

  const { data: incomes } = useQuery({
    queryFn: async () => {
      const res = await apiClient.api.admin.income.$get();
      return res.json();
    },
    queryKey: ["incomes"],
  });
  const { data: expenses } = useQuery({
    queryFn: async () => {
      const res = await apiClient.api.admin.expenses.$get();
      return res.json();
    },
    queryKey: ["expenses"],
  });

  const visibleIncomes = useMemo(
    () => filterAndSort(incomes ?? [], search, sort),
    [incomes, search, sort],
  );
  const visibleExpenses = useMemo(
    () => filterAndSort(expenses ?? [], search, sort),
    [expenses, search, sort],
  );

  // 合計は絞り込み後の一覧に対する金額。表示されている行と数字が食い違わないようにする
  const incomeTotal = visibleIncomes.reduce((total, income) => total + income.amount, 0);
  const expenseTotal = visibleExpenses.reduce((total, expense) => total + expense.amount, 0);

  return (
    <div>
      <Tabs defaultValue="income" className="">
        <TabsList className="w-full border border-brand-blue font-bold">
          <TabsTrigger className={tabsTriggerStyle} id="income" value="income">
            収入
          </TabsTrigger>
          <TabsTrigger className={tabsTriggerStyle} id="expense" value="expense">
            支出
          </TabsTrigger>
        </TabsList>

        <div className="relative mt-4">
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
        <div className="mt-3 mb-4 flex flex-wrap gap-2">
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

        <TabsContent value="income">
          <div className="flex justify-between rounded-t-md bg-brand-blue px-8 py-2 text-lg text-white">
            <span>収入合計</span>
            <span>&yen;{incomeTotal.toLocaleString()}</span>
          </div>
          {visibleIncomes.length === 0 && (
            <p className="border-x-2 border-b-2 border-brand-blue bg-card p-4 text-sm text-muted-foreground">
              該当する収入はありません。
            </p>
          )}
          {visibleIncomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between border-x-2 border-b-2 border-x-brand-blue border-b-brand-blue bg-card p-4"
            >
              <div>
                <h2 className="text-lg font-bold">{income.description}</h2>
                <p className="text-sm font-thin">
                  {new Date(income.occurredOn).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xl text-green-500">{income.amount.toLocaleString()}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="expense">
          <div className="flex justify-between rounded-t-md bg-brand-blue px-8 py-2 text-lg text-white">
            <span>支出合計</span>
            <span>&yen;{expenseTotal.toLocaleString()}</span>
          </div>
          {visibleExpenses.length === 0 && (
            <p className="border-x-2 border-b-2 border-brand-blue bg-card p-4 text-sm text-muted-foreground">
              該当する支出はありません。
            </p>
          )}
          {visibleExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between border-x-2 border-b-2 border-x-brand-blue border-b-brand-blue bg-card p-4"
            >
              <div>
                <h2 className="text-lg font-bold">{expense.description}</h2>
                <p className="text-sm font-thin">
                  {new Date(expense.occurredOn).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xl text-green-500">{expense.amount.toLocaleString()}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsAdminPage;
