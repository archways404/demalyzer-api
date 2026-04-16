import { env } from "../config/env.js";

export async function exchangeFaceitCode({ code, codeVerifier }) {
	const basicAuth = Buffer.from(
		`${env.FACEIT_CLIENT_ID}:${env.FACEIT_CLIENT_SECRET}`,
	).toString("base64");

	const tokenRes = await fetch(env.FACEIT_OAUTH_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			Authorization: `Basic ${basicAuth}`,
		},
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code: String(code),
			redirect_uri: env.FACEIT_REDIRECT_URI,
			code_verifier: codeVerifier,
		}),
	});

	if (!tokenRes.ok) {
		const body = await tokenRes.text();
		throw new Error(`Token exchange failed: ${body}`);
	}

	return tokenRes.json();
}

export async function fetchFaceitUserInfo(accessToken) {
	const userRes = await fetch(env.FACEIT_OAUTH_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!userRes.ok) {
		const body = await userRes.text();
		throw new Error(`User info fetch failed: ${body}`);
	}

	return userRes.json();
}
