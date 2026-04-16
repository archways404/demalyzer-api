import {
	getDetailedPlayerMatchHistory,
	getMatch,
	getPlayerById,
	getPlayerMatchHistory,
	getPlayerStats,
} from "../services/faceit-data.js";

export default async function faceitDataRoutes(app) {
	app.get("/api/faceit/players/:playerId/history", async (request, reply) => {
		try {
			const { playerId } = request.params;
			const { game, offset, limit, from, to } = request.query ?? {};

			const data = await getPlayerMatchHistory(playerId, {
				game,
				offset,
				limit,
				from,
				to,
			});

			return {
				ok: true,
				playerId,
				...data,
			};
		} catch (error) {
			request.log.error(error, "Failed to fetch FACEIT match history");
			return reply.code(500).send({
				ok: false,
				error: error.message || "Failed to fetch FACEIT match history.",
			});
		}
	});

	app.get(
		"/api/faceit/players/:playerId/history-detailed",
		async (request, reply) => {
			try {
				const { playerId } = request.params;
				const { game, offset, limit, from, to } = request.query ?? {};

				const data = await getDetailedPlayerMatchHistory(playerId, {
					game,
					offset,
					limit,
					from,
					to,
				});

				return {
					ok: true,
					playerId,
					...data,
				};
			} catch (error) {
				request.log.error(error, "Failed to fetch FACEIT detailed history");
				return reply.code(500).send({
					ok: false,
					error: error.message || "Failed to fetch FACEIT detailed history.",
				});
			}
		},
	);

	app.get("/api/faceit/matches/:matchId", async (request, reply) => {
		try {
			const { matchId } = request.params;
			const data = await getMatch(matchId);

			return {
				ok: true,
				matchId,
				match: data,
			};
		} catch (error) {
			request.log.error(error, "Failed to fetch FACEIT match");
			return reply.code(500).send({
				ok: false,
				error: error.message || "Failed to fetch FACEIT match.",
			});
		}
	});

	app.get("/api/faceit/players/:playerId/stats", async (request, reply) => {
		try {
			const { playerId } = request.params;
			const { game } = request.query ?? {};

			const data = await getPlayerStats(playerId, game ?? "cs2");

			return {
				ok: true,
				playerId,
				stats: data,
			};
		} catch (error) {
			request.log.error(error, "Failed to fetch FACEIT player stats");
			return reply.code(500).send({
				ok: false,
				error: error.message || "Failed to fetch FACEIT player stats.",
			});
		}
	});

	app.get("/api/faceit/players/:playerId", async (request, reply) => {
		try {
			const { playerId } = request.params;
			const data = await getPlayerById(playerId);

			return {
				ok: true,
				playerId,
				player: data,
			};
		} catch (error) {
			request.log.error(error, "Failed to fetch FACEIT player");
			return reply.code(500).send({
				ok: false,
				error: error.message || "Failed to fetch FACEIT player.",
			});
		}
	});
}
