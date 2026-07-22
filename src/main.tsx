import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { AppProvider } from "./app/AppProvider";
import "./styles/index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Typely could not find the app root.");
}

createRoot(root).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
