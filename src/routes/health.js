import { env } from "../config/env.js";

export default async function healthRoutes(app) {
	app.get("/health", async () => {
		return {
			ok: true,
			service: "demalyzer-api",
			version: env.APP_VERSION ?? "unknown",
			uptimeSeconds: Math.round(process.uptime()),
			timestamp: new Date().toISOString(),
		};
	});
}
