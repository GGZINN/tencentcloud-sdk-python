import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  // os CSVs ficam em ../dados, compartilhados com a versão em Python
  server: { fs: { allow: [".."] } },
});
