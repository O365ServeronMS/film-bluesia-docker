"use client";

import { useEffect } from "react";
import {
  currentReturnTo,
  fallbackReturnToForSource,
  legacySourceFromUrl,
  navSourceFromPath,
  safeInternalPath
} from "@/lib/navigation";

const LAST_NAV_SECTION_KEY = "film.bluesia.net:last-nav-section";

function updateLastNavSection() {
  const key = navSourceFromPath(window.location.pathname);
  if (!key || key === "home") return;
  try {
    sessionStorage.setItem(LAST_NAV_SECTION_KEY, key);
  } catch {
    // Ignore unavailable storage.
  }
}

function repairContextLink(anchor: HTMLAnchorElement, target: URL) {
  if (!target.pathname.startsWith("/movie/") && !target.pathname.startsWith("/watch/")) return;
  if (safeInternalPath(target.searchParams.get("returnTo"))) return;

  const legacyReturnTo = fallbackReturnToForSource(legacySourceFromUrl(target));
  const nextReturnTo = legacyReturnTo || currentReturnTo(window.location.pathname, window.location.search);
  if (!safeInternalPath(nextReturnTo)) return;

  target.searchParams.set("returnTo", nextReturnTo);
  target.searchParams.delete("from");
  if (legacySourceFromUrl(target)) target.hash = "";
  anchor.href = target.pathname + target.search + target.hash;
}

function handleBackLink(event: MouseEvent, anchor: HTMLAnchorElement, target: URL) {
  const explicitPath = safeInternalPath(target.pathname + target.search);
  if (explicitPath) return;

  const referrer = document.referrer;
  if (referrer && window.history.length > 1) {
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
        return;
      }
    } catch {
      // Fall through to current context.
    }
  }

  event.preventDefault();
  window.location.assign(currentReturnTo(window.location.pathname, window.location.search));
}

export function NavigationRepair() {
  useEffect(() => {
    updateLastNavSection();

    const syncEvents = ["popstate", "hashchange", "pageshow", "focus"];
    syncEvents.forEach((eventName) => window.addEventListener(eventName, updateLastNavSection));

    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      let target: URL;
      try {
        target = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      if (target.origin !== window.location.origin) return;

      if (anchor.dataset.navBack !== undefined) {
        handleBackLink(event, anchor, target);
        return;
      }

      repairContextLink(anchor, target);

      if (target.pathname === window.location.pathname && target.pathname.startsWith("/watch/")) {
        event.preventDefault();
        window.location.replace(target.pathname + target.search + target.hash);
      }
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      syncEvents.forEach((eventName) => window.removeEventListener(eventName, updateLastNavSection));
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  return null;
}
