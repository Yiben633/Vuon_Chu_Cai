import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RequireAdmin, RequireAuth, RequireChild, RequireParentGate } from "./auth/RouteGuards.jsx";
import { LoadingState } from "./components/common/StatusStates.jsx";
import { AdminLayout } from "./layouts/AdminLayout.jsx";
import { ChildLayout } from "./layouts/ChildLayout.jsx";
import { ParentLayout } from "./layouts/ParentLayout.jsx";
import { PublicLayout } from "./layouts/PublicLayout.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import { GuestTryPage } from "./pages/public/GuestTryPage.jsx";
import { HomePage } from "./pages/public/HomePage.jsx";
import { AboutPage } from "./pages/public/AboutPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { SignupPage } from "./pages/auth/SignupPage.jsx";
import { AlphabetPage } from "./pages/child/AlphabetPage.jsx";

const ChildDashboardPage = lazy(() =>
  import("./pages/child/ChildDashboardPage.jsx").then((module) => ({ default: module.ChildDashboardPage }))
);
const ChildSectionPage = lazy(() =>
  import("./pages/child/ChildSectionPage.jsx").then((module) => ({ default: module.ChildSectionPage }))
);
const SpellingPage = lazy(() =>
  import("./pages/child/SpellingPage.jsx").then((module) => ({ default: module.SpellingPage }))
);
const StoryPage = lazy(() =>
  import("./pages/child/StoryPage.jsx").then((module) => ({ default: module.StoryPage }))
);
const QuizPage = lazy(() =>
  import("./pages/child/QuizPage.jsx").then((module) => ({ default: module.QuizPage }))
);
const RewardsPage = lazy(() =>
  import("./pages/child/RewardsPage.jsx").then((module) => ({ default: module.RewardsPage }))
);
const ParentDashboardPage = lazy(() =>
  import("./pages/parent/ParentDashboardPage.jsx").then((module) => ({ default: module.ParentDashboardPage }))
);
const ParentSectionPage = lazy(() =>
  import("./pages/parent/ParentSectionPage.jsx").then((module) => ({ default: module.ParentSectionPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/parent/SettingsPage.jsx").then((module) => ({ default: module.SettingsPage }))
);
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage.jsx").then((module) => ({ default: module.AdminDashboardPage }))
);
const AdminSectionPage = lazy(() =>
  import("./pages/admin/AdminSectionPage.jsx").then((module) => ({ default: module.AdminSectionPage }))
);

function lazyPage(element) {
  return <Suspense fallback={<LoadingState />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/gioi-thieu", element: <AboutPage /> },
      { path: "/hoc-thu", element: <GuestTryPage /> },
      { path: "/dang-nhap", element: <LoginPage /> },
      { path: "/dang-ky", element: <SignupPage /> }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/be",
        element: <ChildLayout />,
        children: [
          { index: true, element: lazyPage(<ChildDashboardPage />) },
          {
            element: <RequireChild />,
            children: [
              { path: "bang-chu-cai", element: <AlphabetPage /> },
              { path: "bang-chu-cai/:symbol", element: <AlphabetPage /> },
              { path: "ghep-van", element: lazyPage(<SpellingPage />) },
              { path: "truyen", element: lazyPage(<StoryPage />) },
              { path: "truyen/:slug", element: lazyPage(<StoryPage />) },
              { path: "do-vui", element: lazyPage(<QuizPage />) },
              { path: "phan-thuong", element: lazyPage(<RewardsPage />) }
            ]
          }
        ]
      }
    ]
  },
  {
    element: <RequireParentGate />,
    children: [
      {
        path: "/phu-huynh",
        element: <ParentLayout />,
        children: [
          { index: true, element: lazyPage(<ParentDashboardPage />) },
          { path: "ho-so", element: lazyPage(<ParentSectionPage title="Hồ sơ bé" />) },
          { path: "tien-bo", element: lazyPage(<ParentSectionPage title="Cây tiến bộ" />) },
          { path: "nhan-dien", element: lazyPage(<ParentDashboardPage initialTab="recognition" />) },
          { path: "bai-hoc", element: lazyPage(<ParentDashboardPage initialTab="lessons" />) },
          { path: "thoi-gian", element: lazyPage(<ParentDashboardPage initialTab="time" />) },
          { path: "tai-nguyen", element: lazyPage(<ParentDashboardPage initialTab="resources" />) },
          { path: "hop-thu", element: lazyPage(<ParentDashboardPage initialTab="inbox" />) },
          { path: "cai-dat", element: lazyPage(<SettingsPage />) }
        ]
      }
    ]
  },
  {
    element: <RequireAdmin />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: lazyPage(<AdminDashboardPage />) },
          { path: "hoc-lieu", element: lazyPage(<AdminSectionPage title="Học liệu" />) },
          { path: "bien-tap", element: lazyPage(<AdminSectionPage title="Biên tập" />) },
          { path: "tai-len", element: lazyPage(<AdminSectionPage title="Tải lên" />) }
        ]
      }
    ]
  },
  { path: "*", element: <PublicLayout />, children: [{ path: "*", element: <NotFoundPage /> }] }
], { basename: import.meta.env.BASE_URL });
