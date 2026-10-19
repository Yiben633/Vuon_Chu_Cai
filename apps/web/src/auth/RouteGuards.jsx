import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PinGate } from "../components/auth/PinGate.jsx";
import { ChildProfilePicker } from "../components/auth/ChildProfilePicker.jsx";
import { ErrorState, LoadingState } from "../components/common/StatusStates.jsx";
import { authErrorMessage, useMe } from "./useAuth.js";

export function RequireAuth() {
  const me = useMe();
  const location = useLocation();
  if (me.isLoading) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  if (me.isError) return <Navigate replace state={{ from: location }} to="/dang-nhap" />;
  return <Outlet />;
}

export function RequireChild() {
  const me = useMe();
  if (me.isLoading) return <LoadingState label="Đang kiểm tra hồ sơ bé..." />;
  if (me.isError) return <ChildProfilePicker />;
  if (me.data?.mode !== "child" || !me.data?.currentChildId) return <ChildProfilePicker />;
  return <Outlet />;
}

export function RequireParentGate() {
  const me = useMe();
  if (me.isLoading) return <LoadingState label="Đang kiểm tra quyền phụ huynh..." />;
  if (me.isError) return <Navigate replace to="/dang-nhap" />;
  if (me.data?.mode === "child" || !me.data?.parentGateExpiresAt) {
    return <PinGate message="Nhập PIN để mở góc phụ huynh." title="Cần mở khóa phụ huynh" />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const me = useMe();
  if (me.isLoading) return <LoadingState label="Đang kiểm tra quyền quản trị..." />;
  if (me.isError) return <Navigate replace to="/dang-nhap" />;
  if (me.data?.user?.role !== "admin") {
    return <ErrorState title="Không có quyền quản trị" message="Tài khoản hiện tại không thể mở trang admin." />;
  }
  if (!me.data?.parentGateExpiresAt) {
    return <PinGate message="Admin cần mở khóa PIN trước khi quản trị nội dung." title="Mở khóa admin" />;
  }
  return <Outlet />;
}
