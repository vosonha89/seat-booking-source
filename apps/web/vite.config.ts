import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	plugins: [tailwindcss(), react()],
	server: {
		port: 3000,
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/vitest.setup.ts",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
		},
		exclude: [...configDefaults.exclude],
	},
	resolve: {
		alias: {
			react: resolve(__dirname, "../..", "node_modules/react"),
			"react-dom": resolve(__dirname, "../..", "node_modules/react-dom"),
			"@testing-library/react": resolve(__dirname, "../..", "node_modules/@testing-library/react"),
			"@testing-library/jest-dom": resolve(__dirname, "../..", "node_modules/@testing-library/jest-dom"),
			"@testing-library/user-event": resolve(__dirname, "../..", "node_modules/@testing-library/user-event"),
			"react/jsx-dev-runtime": resolve(__dirname, "../..", "node_modules/react/jsx-dev-runtime.js"),
			"@seat-booking/shared-types": resolve(__dirname, "../..", "packages/shared-types/dist/esm"),
		},
	},
	optimizeDeps: {
		include: ["@seat-booking/shared-types"],
	},
	ssr: {
		noExternal: ["@seat-booking/shared-types"],
	},
});
