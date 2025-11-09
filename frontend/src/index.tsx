import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./AppRouter"; // Import AppRouter
import { HelmetProvider } from 'react-helmet-async';

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AppRouter /> {/* Render AppRouter instead of App */}
    </HelmetProvider>
  </React.StrictMode>
);