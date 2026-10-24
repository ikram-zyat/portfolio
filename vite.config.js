import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import adminApi from "./scripts/vite-admin-plugin.mjs";
import { readAuth } from "./scripts/auth.mjs";

// Le plugin admin n'existe qu'en mode développement (npm run dev / npm run admin).
// Il n'est jamais inclus dans le site publié (npm run build).
// `npm run admin` ouvre directement l'adresse secrète de l'espace admin.
export default defineConfig(({ mode }) => ({
  plugins: [react(), adminApi()],
  server: {
    open: mode === "admin" ? (readAuth()?.path ?? "/admin.html") : false,
  },
}));
