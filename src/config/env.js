import "dotenv/config";

function required(name, value) {
	if (!value) {
		throw new Error(`Missing required env var: ${name}`);
	}
	return value;
}

const PORT = Number(process.env.PORT ?? 5622);
const HOST = process.env.HOST ?? "0.0.0.0";

const FACEIT_CLIENT_ID = required(
	"FACEIT_CLIENT_ID",
	process.env.FACEIT_CLIENT_ID,
);
const FACEIT_CLIENT_SECRET = required(
	"FACEIT_CLIENT_SECRET",
	process.env.FACEIT_CLIENT_SECRET,
);

const FACEIT_REDIRECT_URI = required(
	"FACEIT_REDIRECT_URI",
	process.env.FACEIT_REDIRECT_URI,
);

const FACEIT_OAUTH_AUTHORIZE_URL =
	process.env.FACEIT_OAUTH_AUTHORIZE_URL ?? "https://accounts.faceit.com/";
const FACEIT_OAUTH_TOKEN_URL =
	process.env.FACEIT_OAUTH_TOKEN_URL ??
	"https://api.faceit.com/auth/v1/oauth/token";
const FACEIT_OAUTH_USERINFO_URL =
	process.env.FACEIT_OAUTH_USERINFO_URL ??
	"https://api.faceit.com/auth/v1/resources/userinfo";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? true;

export const env = {
	PORT,
	HOST,
	FACEIT_CLIENT_ID,
	FACEIT_CLIENT_SECRET,
	FACEIT_REDIRECT_URI,
	FACEIT_OAUTH_AUTHORIZE_URL,
	FACEIT_OAUTH_TOKEN_URL,
	FACEIT_OAUTH_USERINFO_URL,
	CORS_ORIGIN,
};
