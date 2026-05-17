// Phase 0 stub. Phase 2 fleshes this into the live proxy.
// Runs on Vercel Edge runtime — no Node-only APIs allowed.
export const config = { runtime: 'edge' };

export default async function handler(_req: Request): Promise<Response> {
  return new Response(
    JSON.stringify({ status: 'stub', message: 'feed proxy not yet wired' }),
    {
      status: 501,
      headers: { 'content-type': 'application/json' },
    },
  );
}
