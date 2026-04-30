import { getSignedDemoDownloadUrl } from '../services/faceit-demo.js';

function classifyFaceitDownloadError(error) {
    if (error.statusCode === 404) {
        return {
            statusCode: 202,
            body: {
                ok: false,
                ready: false,
                error: 'Demo is not available yet.',
            },
        };
    }

    if (error.statusCode === 400) {
        return {
            statusCode: 400,
            body: {
                ok: false,
                ready: null,
                error: 'Invalid FACEIT demo resource_url.',
            },
        };
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
        return {
            statusCode: 502,
            body: {
                ok: false,
                ready: null,
                error: 'FACEIT Downloads API authentication failed.',
            },
        };
    }

    if (error.statusCode === 429) {
        return {
            statusCode: 429,
            body: {
                ok: false,
                ready: null,
                error: 'FACEIT Downloads API rate limit hit. Try again later.',
            },
        };
    }

    return {
        statusCode: 502,
        body: {
            ok: false,
            ready: null,
            error: error.message || 'Failed to request FACEIT demo download URL.',
        },
    };
}

export default async function faceitDemoRoutes(app) {
    app.post('/api/faceit/demos/try-download-url', async (request, reply) => {
        const { resource_url } = request.body ?? {};

        if (!resource_url) {
            return reply.code(400).send({
                ok: false,
                ready: null,
                error: 'resource_url is required.',
            });
        }

        try {
            const signed = await getSignedDemoDownloadUrl(resource_url);

            return {
                ok: true,
                ready: true,
                resourceUrl: signed.resourceUrl,
                downloadUrl: signed.downloadUrl,
            };
        } catch (error) {
            request.log.warn(
                { err: error, resource_url },
                'FACEIT demo download URL request failed',
            );

            const classified = classifyFaceitDownloadError(error);

            return reply.code(classified.statusCode).send(classified.body);
        }
    });
}
