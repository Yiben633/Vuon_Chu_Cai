import { LogOut } from "lucide-react";
import { authErrorMessage, useLogoutMutation, useMe } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { Card } from "../../components/common/Card.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";

export function SettingsPage() {
  const me = useMe();
  const logout = useLogoutMutation();

  if (me.isLoading) return <LoadingState label="Đang tải cài đặt..." />;
  if (me.isError) return <ErrorState message={authErrorMessage(me.error)} />;

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-display text-sm font-black uppercase text-[var(--vc-primary)]">Cài đặt</p>
        <h1 className="mt-2 font-display text-3xl font-black">Phiên đăng nhập</h1>
      </div>
      <Card>
        <dl className="grid gap-3 text-[var(--vc-muted)]">
          <div>
            <dt className="font-bold">Phụ huynh</dt>
            <dd>{me.data.user.displayName}</dd>
          </div>
          <div>
            <dt className="font-bold">Chế độ</dt>
            <dd>{me.data.mode === "child" ? "Bé" : "Phụ huynh"}</dd>
          </div>
        </dl>
        {logout.isError ? (
          <p className="mt-4 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">
            {authErrorMessage(logout.error)}
          </p>
        ) : null}
        <Button className="mt-6" disabled={logout.isPending} icon={LogOut} onClick={() => logout.mutate()}>
          {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </Button>
      </Card>
    </div>
  );
}
