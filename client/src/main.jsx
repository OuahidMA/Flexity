/**
 * Browser entry point.
 *
 * Mounts the SPA with StrictMode, React Router, and the auth provider. Provider
 * order matters: routing must exist before `AuthContext` consumers navigate, and
 * auth must wrap `App` so route guards can read the hydrated session.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import "rsuite/dist/rsuite.min.css";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "@/context/AuthContext";

// RSuite's global styles are loaded here so the routine table is styled
// consistently before any route renders.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
