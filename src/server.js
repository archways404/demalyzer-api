import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

await app.listen({
	port: env.PORT,
	host: env.HOST,
});

app.log.info(
	{
		port: env.PORT,
		host: env.HOST,
		configPath: env.CONFIG_PATH,
	},
	"Demalyzer API started",
);
