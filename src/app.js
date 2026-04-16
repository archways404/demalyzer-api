import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import faceitAuthRoutes from "./routes/faceit-auth.js";
import healthRoutes from "./routes/health.js";
import steamRoutes from "./routes/steam.js";

export async function buildApp() {
	const app = Fastify({
		logger: true,
	});

	await app.register(cors, {
		origin: env.CORS_ORIGIN,
		credentials: true,
	});

	await app.register(healthRoutes);
	await app.register(faceitAuthRoutes);
	await app.register(steamRoutes);

	return app;
}
