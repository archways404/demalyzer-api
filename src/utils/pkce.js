import crypto from "node:crypto";

function base64UrlEncode(buffer) {
	return buffer
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

export function generateCodeVerifier() {
	return base64UrlEncode(crypto.randomBytes(64));
}

export function generateCodeChallenge(codeVerifier) {
	return base64UrlEncode(
		crypto.createHash("sha256").update(codeVerifier).digest(),
	);
}
