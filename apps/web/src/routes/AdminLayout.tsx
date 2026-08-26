import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Wrapper from "@/components/Wrapper";

const NAV_ITEMS = [
  { to: "/dashboard", label: "サマリー", end: true },
  { to: "/dashboard/reimbursements", label: "立替申請" },
  { to: "/dashboard/income", label: "収入" },
  { to: "/dashboard/expenses", label: "支出" },
];

export function AdminLayout() {
  const navigate = useNavigate();

  const { data: circle, isPending } = useQuery({
    queryKey: ["circles", "me"],
    queryFn: async () => {
      const res = await apiClient.api.circles.me.$get();
      if (!res.ok) throw new Error("サークル情報の取得に失敗しました");
      return res.json();
    },
  });

  async function handleSignOut() {
    await authClient.signOut();
    void navigate("/login");
  }

  if (isPending) return null;
  if (!circle) return <Navigate to="/onboarding" replace />;

  return (
    <Wrapper>
      <div className="mx-auto max-w-3xl p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{circle.name}</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            ログアウト
          </Button>
        </div>
        <nav className="mt-6 flex gap-4 border-b pb-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "text-sm text-muted-foreground hover:text-foreground",
                  isActive && "font-medium text-foreground underline underline-offset-4",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6">
          <Outlet context={{ circle }} />
        </div>
      </div>
    </Wrapper>
  );
}
