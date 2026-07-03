import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Static HTML templates under public/templates/* import 3D libs from CDNs
    // (three/addons, stats-gl, etc.) directly in the browser. Vite's dep
    // scanner tries to resolve them from node_modules and warns on every boot.
    // They are not part of the app bundle — exclude them from scanning.
    entries: ["index.html", "src/**/*.{ts,tsx}"],
    exclude: ["msw", "@mswjs/interceptors", "@tanstack/react-start", "@tanstack/start-server-core"],
  },

  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: true,
  },
  // Drop console.* and debugger from production JS via esbuild — no terser install needed.
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 1200,
    minify: "esbuild",
    // Fully disable modulepreload. Vite's default behavior preloads the
    // transitive graph of every async chunk from the entry, which meant the
    // landing page eagerly fetched ~1MB of markdown/syntax/icons/chat code
    // even though those chunks are only used inside authenticated routes.
    // Each lazy route now fetches its own chunks strictly on demand.
    modulePreload: false,
    rollupOptions: {
      external: [/^npm:/, /^https?:\/\//, /^jsr:/, /^node:/],
      output: {
        // Keep only the truly universal runtime packages in a shared vendor
        // chunk. Everything else is left to Rollup's default splitter so that
        // route-specific dependencies (markdown, syntax highlighting, lobehub
        // brand icons, radix widgets, framer-motion, etc.) travel with the
        // async chunk that actually uses them instead of being force-hoisted
        // into the entry graph. This is the fix for the "landing page loads
        // 3.9 MB of JS" regression.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Truly universal — only the React runtime + router live in the
          // entry chunk. Everything else must travel with the route/component
          // that first imports it, Facebook-style.
          if (
            id.includes("/react-dom/") ||
            id.includes("/react/") ||
            id.includes("scheduler") ||
            id.includes("react-router")
          ) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) return "supabase";

          // Motion must stay in one chunk. Splitting Framer Motion internals
          // across `motion-core` / `motion-features` can break its circular
          // initialization order in production builds and crash before React
          // mounts, leaving the app on a blank black screen.
          if (id.includes("framer-motion")) {
            return "motion";
          }

          // @lobehub icons: split per provider so a page that only shows OpenAI
          // doesn't fetch Anthropic + Google + Grok + 50 more SVG chunks.
          if (id.includes("@lobehub")) {
            // Real path shape is `@lobehub/icons/es/<IconName>/index.js` and
            // shared internals live under `@lobehub/icons/es/features|utils|...`.
            const m = id.match(/@lobehub\/icons\/(?:es|dist|lib)\/([^/]+)/i);
            if (m) {
              const seg = m[1].toLowerCase();
              // Keep shared runtime in a single small chunk; each brand icon
              // gets its own chunk so pages only pay for what they render.
              if (["features", "utils", "type", "types", "style", "hooks"].includes(seg)) {
                return "lobehub-runtime";
              }
              return `lobehub-${seg}`;
            }
            return "lobehub-core";
          }

          if (id.includes("lucide-react")) return "icons";

          // Radix packages share internals and create circular dependencies;
          // keep them together to preserve production initialization order.
          if (id.includes("@radix-ui")) {
            return "radix";
          }

          if (
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("rehype-") ||
            id.includes("micromark") ||
            id.includes("mdast-") ||
            id.includes("hast-") ||
            id.includes("unified") ||
            id.includes("unist-")
          ) {
            return "markdown";
          }
          if (id.includes("react-syntax-highlighter") || id.includes("refractor") || id.includes("prismjs") || id.includes("highlight.js")) {
            return "syntax";
          }
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("date-fns") || id.includes("dayjs")) return "date";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("hls.js")) return "hls";
          if (id.includes("lenis")) return "lenis";
        },
      },
    },

  },
});
