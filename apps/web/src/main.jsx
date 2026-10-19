import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AudioProvider } from "./audio/AudioProvider.jsx";
import { queryClient } from "./queryClient.js";
import { router } from "./router.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <RouterProvider router={router} />
      </AudioProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
