import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@wk/ui/theme.css";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
