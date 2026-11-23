import type { PresentCard, PresentState } from "./types";

export const PRESENT_CHANNEL = "pitboard-present";
export const PRESENT_STORAGE_KEY = "pitboard-present-state";

export function broadcastPresent(state: PresentState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRESENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
  try {
    const bc = new BroadcastChannel(PRESENT_CHANNEL);
    bc.postMessage(state);
    bc.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export async function pushPresent(card: PresentCard | null, sessionNote = "") {
  const state: PresentState = {
    card,
    sessionNote,
    updatedAt: Date.now(),
  };
  broadcastPresent(state);
  await fetch("/api/present", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ card, sessionNote }),
  });
  return state;
}

export function readLocalPresent(): PresentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PRESENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PresentState;
  } catch {
    return null;
  }
}
