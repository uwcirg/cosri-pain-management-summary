import { resolve } from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react";
import commonjs from "vite-plugin-commonjs";
export default defineConfig({
  // Specify the path at which the application will be deployed on a server. The path MUST end with "/".
  // To deploy at the root path, use "/" or remove the "base" property entirely.
  base: "/",
  envPrefix: "REACT_",

  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },

  plugins: [
    react(),
    nodePolyfills({
      // include polyfills for the modules that Vite/Rollup warns about
      include: ["events", "timers", "fs"],
    }),
    commonjs({
      filter(id) {
        // `node_modules` is exclude by default, so we need to include it explicitly
        // https://github.com/vite-plugin/vite-plugin-commonjs/blob/v0.7.0/src/index.ts#L125-L127
        if (id.includes("node_modules/commonmark")) {
          return true;
        }
      },
    }),
  ],
  // Stub out large XML JS files that are referenced but not needed
  resolve: {
    alias: {
      "./fhir/models": "/src/stubs/fhir-models.js",
      "./modelInfos/fhir-modelinfo-1.6.xml.js":
        "/src/stubs/fhir-modelinfo-stub.xml.js",
      "./modelInfos/fhir-modelinfo-3.0.0.xml.js":
        "/src/stubs/fhir-modelinfo-stub.xml.js",
      "./modelInfos/fhir-modelinfo-4.0.0.xml.js":
        "/src/stubs/fhir-modelinfo-stub.xml.js",
    },
  },
  build: {
    sourcemap: true,
    // default chunk size limit is 500, but that's nearly impossible due to large JSON files
    chunkSizeWarningLimit: 1500,
    // specify rollup options to enable multiple entry points and break chunks up to smaller sizes
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        launch: resolve(__dirname, "launch.html"),
      },
      output: {
        manualChunks: (id) => {
          if (
            /src[/\\]cql[/\\]dstu2[/\\]/.test(id) ||
            /fhir-modelinfo-1\.0\.2\.xml\.js/.test(id)
          ) {
            return "dstu2";
          }
          if (
            /src[/\\]cql[/\\]r4[/\\]/.test(id) ||
            /fhir-modelinfo-4\.0\.1\.xml\.js/.test(id)
          ) {
            return "r4";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (/src[/\\]config[/\\]report\_config\.js/.test(id)) {
            return "report-config-chunk";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: true,
    reporters: ["verbose"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: [],
    },
  },
});
