import crypto from "node:crypto";
import { env } from "../config/env.js";
import {
	exchangeFaceitCode,
	fetchFaceitUserInfo,
} from "../services/faceit-oauth.js";
import { generateCodeChallenge, generateCodeVerifier } from "../utils/pkce.js";

const pendingStates = new Map();

export default async function faceitAuthRoutes(app) {
	app.get("/auth/faceit/start", async (_request, reply) => {
		const state = crypto.randomUUID();
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = generateCodeChallenge(codeVerifier);

		pendingStates.set(state, {
			createdAt: Date.now(),
			codeVerifier,
		});

		const params = new URLSearchParams({
			client_id: env.FACEIT_CLIENT_ID,
			redirect_uri: env.FACEIT_REDIRECT_URI,
			response_type: "code",
			scope: "openid profile",
			state,
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
		});

		const authorizeUrl = `${env.FACEIT_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
		app.log.info({ authorizeUrl }, "Redirecting to FACEIT authorize URL");

		return reply.redirect(authorizeUrl);
	});

	app.get("/auth/faceit/callback", async (request, reply) => {
		const { code, state, error } = request.query;

		app.log.info({ query: request.query }, "FACEIT callback hit");

		if (error) {
			return reply.redirect(
				`${env.FRONTEND_ERROR_URL}&reason=${encodeURIComponent(String(error))}`,
			);
		}

		if (!code || !state || !pendingStates.has(state)) {
			return reply.code(400).send({
				ok: false,
				error: "Invalid OAuth callback. Missing or invalid code/state.",
			});
		}

		const pending = pendingStates.get(state);
		pendingStates.delete(state);

		try {
			const tokenJson = await exchangeFaceitCode({
				code,
				codeVerifier: pending.codeVerifier,
			});

			const accessToken = tokenJson.access_token ?? "";
			const refreshToken = tokenJson.refresh_token ?? "";
			const idToken = tokenJson.id_token ?? "";

			const userJson = await fetchFaceitUserInfo(accessToken);

			const playerId = userJson.sub ?? "";
			const nickname =
				userJson.nickname ??
				[userJson.given_name, userJson.family_name].filter(Boolean).join(" ");

			const saved = mergeFaceitIntoConfig({
				playerId,
				nickname,
				accessToken,
				refreshToken,
				idToken,
			});

			app.log.info(
				{
					playerId: saved.faceit.playerId,
					nickname: saved.faceit.nickname,
				},
				"FACEIT login saved",
			);

			return reply.redirect(`${env.FRONTEND_SUCCESS_URL}?faceit=connected`);
		} catch (err) {
			app.log.error(err, "FACEIT callback failed");
			return reply.redirect(
				`${env.FRONTEND_ERROR_URL}&reason=${encodeURIComponent(err.message)}`,
			);
		}
	});

	app.get("/api/faceit/status", async () => {
		const config = ensureConfigFile();
		return {
			connected: Boolean(config.faceit?.connected),
			playerId: config.faceit?.playerId ?? "",
			nickname: config.faceit?.nickname ?? "",
		};
	});
}
