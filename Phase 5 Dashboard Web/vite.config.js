import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// Static SPA. Base "./" agar bisa di-deploy di root Vercel/Cloudflare maupun subpath.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: "./",
    build: {
        target: "es2020",
        outDir: "dist",
        rollupOptions: {
            output: {
                manualChunks: {
                    echarts: ["echarts"],
                    react: ["react", "react-dom"],
                },
            },
        },
    },
});
