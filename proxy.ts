import { auth } from "@/auth";

const CACHE_TTL = 5000;
const cacheStore = new Map<string, { timestamp: number; status: number; headers: Record<string, string>; body: string }>();

function getCachedResponse(key: string) {
  const cached = cacheStore.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cacheStore.delete(key);
    return null;
  }
  return cached;
}

async function fetchWithBypass(req: Request) {
  const clonedHeaders = new Headers(req.headers);
  clonedHeaders.set("x-proxy-cache-bypass", "1");
  return fetch(req.url, {
    method: req.method,
    headers: clonedHeaders,
    body: req.method === "GET" ? undefined : await req.clone().arrayBuffer(),
    redirect: "manual",
  });
}

function shouldCacheRequest(url: URL, req: Request) {
  if (req.method !== "GET") return false;
  if (!url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/api/auth")) return false;
  if (req.headers.get("x-proxy-cache-bypass") === "1") return false;
  return true;
}



export async function proxy(req: Request) {
  const url = new URL(req.url);

  // Do not run the proxy/cache logic for API routes. This pattern can re-fetch
  // the same /api URL and create the same runaway loop seen in the Vercel logs.
  if (url.pathname.startsWith("/api/")) {
    return (auth as any)(req);
  }

  if (shouldCacheRequest(url, req)) {
    const cacheKey = url.toString();
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
    }

    const response = await fetchWithBypass(req);
    const body = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    if (response.ok) {
      cacheStore.set(cacheKey, {
        timestamp: Date.now(),
        status: response.status,
        headers: responseHeaders,
        body,
      });
    }
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  return (auth as any)(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/).*)",
  ],
};

