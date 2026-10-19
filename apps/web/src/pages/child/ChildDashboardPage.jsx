import { Button } from "../../components/common/Button.jsx";
import { ChildProfilePicker } from "../../components/auth/ChildProfilePicker.jsx";
import { MascotGuide } from "../../components/domain/MascotGuide.jsx";
import { LoadingState } from "../../components/common/StatusStates.jsx";
import { useMe } from "../../auth/useAuth.js";

export function ChildDashboardPage() {
  const me = useMe();
  if (me.isLoading) return <LoadingState label="Đang kiểm tra hồ sơ bé..." />;
  if (me.data?.mode !== "child" || !me.data?.currentChildId) return <ChildProfilePicker />;

  return (
    <div className="grid gap-6">
      <MascotGuide title="Hôm nay mình học gì?">
        <p>Chọn một khu bên dưới. Các phiên học thật sẽ được nối với backend ở các prompt gameplay.</p>
      </MascotGuide>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button to="/be/bang-chu-cai">Bảng chữ cái</Button>
        <Button to="/be/ghep-van" variant="secondary">Ghép vần</Button>
        <Button to="/be/truyen" variant="secondary">Đọc truyện</Button>
        <Button to="/be/do-vui" variant="reward">Đố vui</Button>
      </div>
    </div>
  );
}
