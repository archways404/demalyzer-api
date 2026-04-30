import { env } from '../config/env.js';

const FACEIT_DOWNLOAD_API_BASE = 'https://open.faceit.com';

function getFaceitDownloadHeaders() {
    return {
        Authorization: `Bearer ${env.FACEIT_DOWNLOAD_API_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
}

export async function getSignedDemoDownloadUrl(resourceUrl) {
    if (!resourceUrl) {
        throw new Error('resource_url is required.');
    }

    const res = await fetch(`${FACEIT_DOWNLOAD_API_BASE}/download/v2/demos/download`, {
        method: 'POST',
        headers: getFaceitDownloadHeaders(),
        body: JSON.stringify({
            resource_url: resourceUrl,
        }),
    });

    const text = await res.text();

    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        const error = new Error(
            `FACEIT Downloads API returned non-JSON (${res.status}): ${text.slice(0, 300)}`,
        );

        error.statusCode = res.status;
        throw error;
    }

    if (!res.ok) {
        const error = new Error(
            `FACEIT Downloads API error ${res.status}: ${JSON.stringify(data)}`,
        );

        error.statusCode = res.status;
        error.faceitResponse = data;

        throw error;
    }

    const downloadUrl = data?.payload?.download_url;

    if (!downloadUrl) {
        const error = new Error('FACEIT Downloads API did not return payload.download_url.');

        error.statusCode = 502;
        error.faceitResponse = data;

        throw error;
    }

    return {
        resourceUrl,
        downloadUrl,
        raw: data,
    };
}
