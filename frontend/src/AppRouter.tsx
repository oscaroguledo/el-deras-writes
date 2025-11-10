import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes, App } from "./App";

const router = createBrowserRouter(routes);

export function AppRouter() {
  return (
    <App>
      <RouterProvider router={router} />
    </App>
  );
}