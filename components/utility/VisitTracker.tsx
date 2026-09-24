"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * VisitTracker
 * Silently POSTs a visit record to /api/visit whenever the pathname changes.
 * Works for all users — signed in or not — since it uses only browser-side info.
 * Uses sessionStorage to debounce: one record per unique path per browser session.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const sentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/stock") || pathname.startsWith("/sales") || pathname.startsWith("/expenses")) return;

    // Get or create browser ID
    let browserId = localStorage.getItem("health-clique-browser-id");
    if (!browserId) {
      browserId = crypto.randomUUID();
      localStorage.setItem("health-clique-browser-id", browserId);
    }

    // Debounce: only send once per path per browser tab session
    const key = `visit:${pathname}`;
    if (sentRef.current.has(key)) return;
    sentRef.current.add(key);

    // Fire-and-forget — never block the page
    try {
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, browserId }),
        // keepalive so it completes even if the user navigates away
        keepalive: true,
      }).catch(() => {}); // swallow errors silently
    } catch {
      // noop
    }

  }, [pathname]);

  return null; // renders nothing
}
