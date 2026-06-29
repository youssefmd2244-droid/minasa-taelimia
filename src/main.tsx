import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { bootstrapCapacitor } from "./mobile/capacitor";

// يهيّئ جسر Capacitor فقط عند التشغيل داخل تطبيق أندرويد/iOS أصلي —
// لا يفعل شيئاً على الويب العادي (Capacitor.isNativePlatform() === false).
bootstrapCapacitor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
