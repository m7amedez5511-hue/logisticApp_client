
"use client";

import { useEffect } from "react";

// Some browser extensions (Bitdefender TrafficLight and similar) inject
// bis_skin_checked / bis_register attributes onto form elements before
// React hydrates the page. This causes a harmless but noisy hydration
// mismatch warning. This component strips those attributes after mount
// and keeps watching for re-injection, without disabling SSR/hydration.
export const WATCHED_ATTRS = [
  "bis_skin_checked",
  "bis_register",
  "__processed_by_bitdefender__",
] as const;

export function ExtensionAttributeCleanup() {
  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }

    const selector = WATCHED_ATTRS.map((attr) => `[${attr}]`).join(",");

    function strip() {
      const rootElements = [document.documentElement, document.body].filter(
        (element): element is HTMLElement => element !== null,
      );

      rootElements.forEach((element) => {
        WATCHED_ATTRS.forEach((attr) => element.removeAttribute(attr));
      });

      document.querySelectorAll(selector).forEach(el => {
        WATCHED_ATTRS.forEach(attr => el.removeAttribute(attr));
      });
    }

    let frameId: number | null = null;
    function scheduleStrip() {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        strip();
      });
    }

    // Initial cleanup right after hydration
    strip();

    // Extensions can re-inject the attribute after every re-render
    // (e.g. after clicking Save, which re-renders the form), so keep
    // watching instead of running once.
    const observer = new MutationObserver(scheduleStrip);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: [...WATCHED_ATTRS],
    });

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Renders nothing — side-effect-only component
  return null;
}