import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
//
// ملاحظة هامة: تمت إزالة `vite-plugin-singlefile` نهائياً. كان هذا الـ
// plugin يدمج كل JS/CSS/الصور (base64) في ملف HTML واحد يُحمَّل كاملاً
// دفعة واحدة قبل أي رسم على الشاشة — وهو السبب الجذري المباشر للّاج
// المرصود سابقاً. الإعداد الحالي يفعّل code-splitting طبيعياً.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["framer-motion"],
          icons: ["lucide-react"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
