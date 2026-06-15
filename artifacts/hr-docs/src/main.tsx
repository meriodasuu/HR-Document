import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setBaseUrl, setUnauthorizedHandler } from "@workspace/api-client-react";
import { clearAuth, getToken } from "@/lib/auth";

setBaseUrl(import.meta.env.VITE_API_URL ?? null);
setAuthTokenGetter(() => getToken());
setUnauthorizedHandler(() => {
  clearAuth();
  window.dispatchEvent(new Event("hr-logout"));
});

createRoot(document.getElementById("root")!).render(<App />);
