"use client";

import axios, { AxiosResponse } from "axios";

const CACHE_TTL = 5000;
const publicModels = new Set([
  "activeIngredient",
  "brand",
  "business",
  "category",
  "featuredProduct",
  "healthConcern",
  "product",
]);

type CachedFetch = {
  timestamp: number;
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
};

type CachedAxios = {
  timestamp: number;
  response: AxiosResponse;
};

const fetchCache = new Map<string, CachedFetch>();
const fetchPending = new Map<string, Promise<CachedFetch>>();
const axiosCache = new Map<string, CachedAxios>();
const axiosPending = new Map<string, Promise<AxiosResponse>>();

function isCacheable(urlValue: string) {
  const url = new URL(urlValue, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname !== "/api/dbhandler") return false;
  if (!publicModels.has(url.searchParams.get("model") || "")) return false;
  if (url.searchParams.has("userId") || url.searchParams.has("code")) return false;
  return true;
}

function cacheKey(method: string, urlValue: string) {
  const url = new URL(urlValue, window.location.origin);
  url.searchParams.sort();
  return `${method.toUpperCase()}:${url.toString()}`;
}

function isFresh(timestamp: number) {
  return Date.now() - timestamp < CACHE_TTL;
}

function createFetchResponse(entry: CachedFetch) {
  return new Response(entry.body, {
    status: entry.status,
    statusText: entry.statusText,
    headers: entry.headers,
  });
}

if (typeof window !== "undefined") {
  const originalFetch = window.fetch.bind(window);
  const originalAxiosGet = axios.get.bind(axios);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method || (input instanceof Request ? input.method : "GET");
    const url = input instanceof Request ? input.url : input.toString();

    if (method.toUpperCase() !== "GET" || !isCacheable(url)) {
      return originalFetch(input, init);
    }

    const key = cacheKey(method, url);
    const cached = fetchCache.get(key);
    if (cached && isFresh(cached.timestamp)) return createFetchResponse(cached);
    if (cached) fetchCache.delete(key);

    const pending = fetchPending.get(key);
    if (pending) return createFetchResponse(await pending);

    const request = originalFetch(input, init).then(async (response) => {
      const entry: CachedFetch = {
        timestamp: Date.now(),
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers.entries()),
        body: await response.text(),
      };
      if (response.ok) fetchCache.set(key, entry);
      return entry;
    });

    fetchPending.set(key, request);
    try {
      return createFetchResponse(await request);
    } finally {
      fetchPending.delete(key);
    }
  };

  axios.get = (async (url: string, config?: any) => {
    if (!isCacheable(url)) return originalAxiosGet(url, config);

    const key = cacheKey("GET", url);
    const cached = axiosCache.get(key);
    if (cached && isFresh(cached.timestamp)) return cached.response;
    if (cached) axiosCache.delete(key);

    const pending = axiosPending.get(key);
    if (pending) return pending;

    const request = originalAxiosGet(url, config).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        axiosCache.set(key, { timestamp: Date.now(), response });
      }
      return response;
    });

    axiosPending.set(key, request);
    try {
      return await request;
    } finally {
      axiosPending.delete(key);
    }
  }) as typeof axios.get;
}

export default function ClientApiCache() {
  return null;
}
