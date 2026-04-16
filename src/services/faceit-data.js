import { env } from "../config/env.js";

const FACEIT_DATA_API_BASE = "https://open.faceit.com/data/v4";

function getFaceitDataHeaders() {
	return {
		Authorization: `Bearer ${env.FACEIT_DATA_API_KEY}`,
		Accept: "application/json",
	};
}

async function faceitDataRequest(pathname, { searchParams } = {}) {
	const url = new URL(`${FACEIT_DATA_API_BASE}${pathname}`);

	if (searchParams) {
		for (const [key, value] of Object.entries(searchParams)) {
			if (value !== undefined && value !== null && value !== "") {
				url.searchParams.set(key, String(value));
			}
		}
	}

	const res = await fetch(url, {
		method: "GET",
		headers: getFaceitDataHeaders(),
	});

	const text = await res.text();

	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		throw new Error(
			`FACEIT Data API returned non-JSON (${res.status}): ${text.slice(0, 300)}`,
		);
	}

	if (!res.ok) {
		throw new Error(
			`FACEIT Data API error ${res.status}: ${JSON.stringify(data)}`,
		);
	}

	return data;
}

export async function getPlayerMatchHistory(playerId, options = {}) {
	return faceitDataRequest(`/players/${encodeURIComponent(playerId)}/history`, {
		searchParams: {
			game: options.game ?? "cs2",
			offset: options.offset ?? 0,
			limit: options.limit ?? 20,
			from: options.from,
			to: options.to,
		},
	});
}

export async function getMatch(matchId) {
	return faceitDataRequest(`/matches/${encodeURIComponent(matchId)}`);
}

export async function getPlayerStats(playerId, game = "cs2") {
	return faceitDataRequest(
		`/players/${encodeURIComponent(playerId)}/stats/${encodeURIComponent(game)}`,
	);
}

export async function getPlayerById(playerId) {
	return faceitDataRequest(`/players/${encodeURIComponent(playerId)}`);
}

export async function getDetailedPlayerMatchHistory(playerId, options = {}) {
	const history = await getPlayerMatchHistory(playerId, options);
	const items = history.items ?? [];

	const detailedItems = await Promise.all(
		items.map(async (item) => {
			try {
				const matchDetail = await getMatch(item.match_id);

				return {
					...item,
					matchDetail,
					map:
						matchDetail?.voting?.map?.pick?.[0] ||
						matchDetail?.i18n?.game_map ||
						matchDetail?.game_map ||
						matchDetail?.map ||
						null,
					demoUrl: matchDetail?.demo_url ?? null,
				};
			} catch (error) {
				return {
					...item,
					matchDetail: null,
					map: null,
					demoUrl: null,
					matchDetailError: error.message || "Failed to fetch match detail.",
				};
			}
		}),
	);

	return {
		...history,
		items: detailedItems,
	};
}
