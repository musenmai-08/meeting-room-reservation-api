import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@application": path.resolve(__dirname, "src/application"),
			"@domain": path.resolve(__dirname, "src/domain"),
		},
	},
});
