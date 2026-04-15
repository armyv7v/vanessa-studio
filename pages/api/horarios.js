// runtime = 'edge' eliminado: open-next con Cloudflare Pages corre todo en edge,
// declararlo explícitamente rompe el bundler (OpenNext no lo soporta como override individual).

const BACKEND_URL = 'https://vanessastudioback.netlify.app/.netlify/functions';

function getCookie(req, name) {
    const cookies = req.headers.get('cookie') || '';
    const match = cookies.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
}

export default async function handler(req) {
    // Verify admin token
    const token = getCookie(req, 'admin_token');
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Proxy to Netlify backend
    try {
        const backendUrl = `${BACKEND_URL}/horarios`;
        const body = req.method === 'POST' ? await req.text() : undefined;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });

        const data = await response.text();
        return new Response(data, {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Horarios proxy error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to communicate with backend',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
