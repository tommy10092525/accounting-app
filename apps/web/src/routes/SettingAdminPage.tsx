import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

const FIELD_CLASS = "mt-2 h-12 rounded-xl border-2 border-brand-blue bg-card";

function RequiredBadge() {
  return <span className="ml-1 text-xs text-primary">必須</span>;
}

function OptionalBadge() {
  return <span className="ml-1 text-xs text-muted-foreground">任意</span>;
}

const SettingAdminPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: settings, isPending } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await apiClient.api.admin.settings.$get();
      if (!res.ok) throw new Error("会員情報の取得に失敗しました");
      return res.json();
    },
  });

  const [circleName, setCircleName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 取得した現在値をフォームの初期値として流し込む
  useEffect(() => {
    if (!settings) return;
    setCircleName(settings.circleName);
    setUniversityName(settings.universityName);
    setRepresentativeName(settings.representativeName);
    setPhoneNumber(settings.phoneNumber);
    setEmail(settings.email);
  }, [settings]);

  async function handleSignOut() {
    await authClient.signOut();
    void navigate("/login");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    setError(null);
    setNotice(null);

    const wantsPasswordChange = password.length > 0 || passwordConfirm.length > 0;
    if (wantsPasswordChange) {
      if (password !== passwordConfirm) {
        setError("新しいパスワードが一致しません");
        return;
      }
      if (!currentPassword) {
        setError("パスワードを変更するには現在のパスワードを入力してください");
        return;
      }
    }

    setIsSubmitting(true);
    const messages: string[] = [];

    // 1. プロフィール(サークル名・大学名・代表者名・電話番号)
    const profileRes = await apiClient.api.admin.settings.$patch({
      json: { circleName, universityName, representativeName, phoneNumber },
    });
    if (!profileRes.ok) {
      setIsSubmitting(false);
      setError("会員情報の更新に失敗しました。入力内容をご確認ください。");
      return;
    }
    messages.push("会員情報を更新しました");

    // 2. メールアドレス(変更があった場合のみ)。確認が済むまで実際には切り替わらない。
    if (email !== settings.email) {
      const { error: emailError } = await authClient.changeEmail({
        newEmail: email,
        callbackURL: `${window.location.origin}/#/dashboard/setting`,
      });
      if (emailError) {
        setIsSubmitting(false);
        setError(emailError.message ?? "メールアドレスの変更に失敗しました");
        return;
      }
      messages.push(
        `確認メールを現在のアドレス(${settings.email})に送信しました。リンクを開くと ${email} に変更されます`,
      );
    }

    // 3. パスワード(入力があった場合のみ)
    if (wantsPasswordChange) {
      const { error: passwordError } = await authClient.changePassword({
        currentPassword,
        newPassword: password,
        revokeOtherSessions: true,
      });
      if (passwordError) {
        setIsSubmitting(false);
        setError("パスワードの変更に失敗しました。現在のパスワードをご確認ください。");
        return;
      }
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
      messages.push("パスワードを変更しました");
    }

    setIsSubmitting(false);
    setNotice(messages.join(" / "));
    void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    void queryClient.invalidateQueries({ queryKey: ["circles", "me"] });
  }

  if (isPending) return null;

  return (
    <div>
      <h1 className="text-center text-2xl font-bold">設定</h1>
      <div className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <Label htmlFor="notification" className="text-xl">
            通知設定
          </Label>
          {/* 通知の配信基盤が未実装のため、現時点では表示のみ */}
          <Switch className="data-[state=checked]:bg-brand-blue" id="notification" disabled />
        </div>
        <div className="flex flex-col gap-2">
          <button className="bg-brand-blue rounded-lg py-2 px-4 text-white text-left hover:underline">
            <Link to={"#"}>会計書式の登録・変更 &gt;</Link>
          </button>
          <button className="bg-brand-blue rounded-lg py-2 px-4 text-white text-left hover:underline">
            <Link to={"/dashboard/subscription"}>サブスク管理 &gt;</Link>
          </button>
        </div>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="mx-auto rounded-full border-2 border-rose-500 px-6 py-4 text-rose-500 hover:bg-transparent bg-card"
        >
          ログアウト
        </Button>
        <div>
          <Link to="#" className="text-xl underline">
            ヘルプ・お問い合わせ{"         >"}
          </Link>
        </div>

        <h2 className="text-center text-2xl font-bold">会員情報</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="circle-name">
              サークル名 <RequiredBadge />
            </Label>
            <Input
              id="circle-name"
              required
              placeholder="テキストを入力"
              className={FIELD_CLASS}
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="university-name">
              大学名 <RequiredBadge />
            </Label>
            <Input
              id="university-name"
              required
              placeholder="テキストを入力"
              className={FIELD_CLASS}
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="representative-name">
              サークル代表者名 <RequiredBadge />
            </Label>
            <Input
              id="representative-name"
              required
              placeholder="テキストを入力"
              className={FIELD_CLASS}
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="phone-number">
              代表者電話番号 <RequiredBadge />
            </Label>
            <Input
              id="phone-number"
              type="tel"
              required
              placeholder="09012345678"
              className={FIELD_CLASS}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="email">
              メールアドレス(ログインID) <RequiredBadge />
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="メールアドレスを入力"
              className={FIELD_CLASS}
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              変更すると、現在のアドレス宛に確認メールが届きます。リンクを開くまで変更は反映されません。
            </p>
          </div>

          <p className="mt-8 text-sm font-medium">パスワードを変更する場合のみ入力してください</p>
          <div className="mt-2">
            <Label htmlFor="current-password">
              現在のパスワード <OptionalBadge />
            </Label>
            <Input
              id="current-password"
              type="password"
              placeholder="現在のパスワード"
              className={FIELD_CLASS}
              value={currentPassword}
              autoComplete="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="password">
              新しいパスワード <OptionalBadge />
            </Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              placeholder="8文字以上"
              className={FIELD_CLASS}
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <Label htmlFor="password-confirm">
              新しいパスワード(確認) <OptionalBadge />
            </Label>
            <Input
              id="password-confirm"
              type="password"
              minLength={8}
              placeholder="もう一度入力"
              className={FIELD_CLASS}
              value={passwordConfirm}
              autoComplete="new-password"
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>

          {error && <p className="mt-4 text-center text-xs text-destructive">{error}</p>}
          {notice && <p className="mt-4 text-center text-xs text-brand-blue">{notice}</p>}
          <div className="mt-8 flex items-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mx-auto rounded-full px-8 py-2 text-lg"
            >
              {isSubmitting ? "保存中..." : "変更を保存"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingAdminPage;
