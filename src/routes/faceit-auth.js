import crypto from "node:crypto";
import { env } from "../config/env.js";
import {
	exchangeFaceitCode,
	fetchFaceitUserInfo,
} from "../services/faceit-oauth.js";
import { generateCodeChallenge, generateCodeVerifier } from "../utils/pkce.js";

const pendingStates = new Map();
const completedFaceitLogins = new Map();

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
				`demalyzer://faceit/callback?error=${encodeURIComponent(String(error))}`,
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

			const sessionId = crypto.randomUUID();

			completedFaceitLogins.set(sessionId, {
				playerId,
				nickname,
				accessToken,
				refreshToken,
				idToken,
				createdAt: Date.now(),
			});

			app.log.info(
				{
					sessionId,
					playerId,
					nickname,
				},
				"FACEIT login completed",
			);

			const deepLink = `demalyzer://faceit/callback?sessionId=${encodeURIComponent(sessionId)}`;
			app.log.info({ deepLink }, "Redirecting to Electron deep link");

			return reply.redirect(deepLink);
		} catch (err) {
			app.log.error(err, "FACEIT callback failed");
			return reply.redirect(
				`demalyzer://faceit/callback?error=${encodeURIComponent(err.message)}`,
			);
		}
	});

	app.get("/api/faceit/session/:sessionId", async (request, reply) => {
		const { sessionId } = request.params;
		const session = completedFaceitLogins.get(sessionId);

		if (!session) {
			return reply.code(404).send({
				ok: false,
				error: "FACEIT session not found or already consumed.",
			});
		}

		completedFaceitLogins.delete(sessionId);

		return {
			ok: true,
			faceit: {
				playerId: session.playerId,
				nickname: session.nickname,
				accessToken: session.accessToken,
				refreshToken: session.refreshToken,
				idToken: session.idToken,
			},
		};
	});

	app.get("/", async () => {
		return {
			ok: false,
			error: "Root hit",
			expected: "/auth/faceit/callback",
		};
	});
}
