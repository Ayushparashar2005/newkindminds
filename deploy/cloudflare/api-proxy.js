// Optional Cloudflare Worker: serves the KindMinds API on your own hostname
// (e.g. api.kindminds.org) while the app keeps running in a boat sandbox.
//
// boat routes on the on.boat.dev host name and has no custom-domain support, so a
// plain DNS CNAME/A record does not work. This Worker fetches the boat URL directly,
// which makes Cloudflare send that host name upstream, and streams the response
// back unchanged (including Server-Sent Events from the AI endpoints).
//
// Deploy:  npx wrangler deploy --config deploy/cloudflare/wrangler.jsonc
export default {
  async fetch(request, env) {
    const upstream = env.UPSTREAM;
    if (!upstream) {
      return new Response('UPSTREAM is not configured', { status: 500 });
    }

    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, upstream);

    // Let Cloudflare/Fetch derive Host from the target URL — that is what boat routes on.
    const headers = new Headers(request.headers);
    headers.delete('host');

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const upstreamResponse = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
    });

    // Pass status and headers through; the backend already sends permissive CORS
    // headers, so the Pages origin keeps working through this hop.
    return new Response(upstreamResponse.body, upstreamResponse);
  },
};
