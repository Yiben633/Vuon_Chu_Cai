import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./ui/AppShell.jsx";
import { HomePage } from "./ui/HomePage.jsx";
import { NotFoundPage } from "./ui/NotFoundPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "gioi-thieu", element: <HomePage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
