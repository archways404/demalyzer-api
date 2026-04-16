import { resolveSteamProfile } from "../services/steam-resolver.js";

export default async function steamRoutes(app) {
	app.post("/api/steam/resolve-id", async (request, reply) => {
		try {
			const { input } = request.body ?? {};
			const result = await resolveSteamProfile(input);
			return result;
		} catch (error) {
			return reply.code(400).send({
				ok: false,
				error: error.message,
			});
		}
	});
}
