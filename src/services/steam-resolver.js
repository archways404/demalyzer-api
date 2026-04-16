export async function resolveSteamProfile(input) {
	const raw = String(input || "").trim();

	if (!raw) {
		throw new Error("Steam profile value is required.");
	}

	const profilesMatch = raw.match(
		/^https?:\/\/steamcommunity\.com\/profiles\/(\d{17})\/?$/i,
	);
	if (profilesMatch) {
		return {
			steamId: profilesMatch[1],
			source: "profiles_url",
		};
	}

	const vanityUrlMatch = raw.match(
		/^https?:\/\/steamcommunity\.com\/id\/([^/?#]+)\/?$/i,
	);

	let id = raw;
	if (vanityUrlMatch) {
		id = vanityUrlMatch[1];
	}

	if (/^\d{17}$/.test(id)) {
		return {
			steamId: id,
			source: "direct_steamid",
		};
	}

	const res = await fetch("https://steamidcheck.com/api/steam/resolve-id", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ id }),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to resolve Steam ID: ${res.status} ${text}`);
	}

	const data = await res.json();

	if (!data?.steamId || !/^\d{17}$/.test(String(data.steamId))) {
		throw new Error("Could not resolve Steam profile to a valid SteamID64.");
	}

	return {
		steamId: String(data.steamId),
		source: "steamidcheck",
	};
}
