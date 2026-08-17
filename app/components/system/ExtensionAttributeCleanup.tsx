
"use client";

import { useEffect } from "react";

// Some browser extensions (Bitdefender TrafficLight and similar) inject
// bis_skin_checked / bis_register attributes onto form elements before
// React hydrates the page. This causes a harmless but noisy hydration
// mismatch warning. This component strips those attributes after mount
// and keeps watching for re-injection, without disabling SSR/hydration.
const WATCHED_ATTRS = ["bis_skin_checked", "bis_register", "__processed_by_bitdefender__"];

export function ExtensionAttributeCleanup() {
  useEffect(() => {
    function strip() {
      const selector = WATCHED_ATTRS.map(a => `[${a}]`).join(",");
      document.querySelectorAll(selector).forEach(el => {
        WATCHED_ATTRS.forEach(attr => el.removeAttribute(attr));
      });
    }

    // Initial cleanup right after hydration
    strip();

    // Extensions can re-inject the attribute after every re-render
    // (e.g. after clicking Save, which re-renders the form), so keep
    // watching instead of running once.
    const observer = new MutationObserver(strip);
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: WATCHED_ATTRS,
    });

    return () => observer.disconnect();
  }, []);

  // Renders nothing — side-effect-only component
  return null;
}