import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@domain": path.resolve(__dirname, "src/domain"),
		},
	},
});

