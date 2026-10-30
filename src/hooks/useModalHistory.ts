"use client";

import { useEffect, useId, useRef } from "react";

/** Owns only the entry created by this modal; never intercepts unrelated navigation. */
export function useModalHistory(open: boolean, onOpenChange: (open: boolean) => void) {
  const changeRef = useRef(onOpenChange);
  const openRef = useRef(open);
  const token = useId();
  changeRef.current = onOpenChange;
  openRef.current = open;

  useEffect(() => {
    const onPop = () => {
      const nextOpen = history.state?.softshakeModal === token;
      if (openRef.current !== nextOpen) changeRef.current(nextOpen);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const url = location.href;
    const scrollY = window.scrollY;
    let created = history.state?.softshakeModal === token;
    const frame = requestAnimationFrame(() => {
      if (created) return;
      if (history.state?.softshakeMenu) {
        history.replaceState({ ...history.state, softshakeMenu: { ...history.state.softshakeMenu, scrollY } }, "", url);
      }
      history.pushState({ ...history.state, softshakeModal: token }, "", url);
      created = true;
    });
    return () => {
      cancelAnimationFrame(frame);
      if (created && location.href === url && history.state?.softshakeModal === token) {
        history.back();
      }
      // The modal never scrolls the document; Radix restores its scroll lock.
      if (location.href === url) requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
    };
  }, [open, token]);
}
