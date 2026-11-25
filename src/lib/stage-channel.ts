import type { ClassSession } from "./types";

export const STAGE_CHANNEL = "pitboard-stage";
export const STAGE_STORAGE_KEY = "pitboard-stage-state";

export function broadcastStage(session: ClassSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  try {
    const bc = new BroadcastChannel(STAGE_CHANNEL);
    bc.postMessage(session);
    bc.close();
  } catch {
    /* ignore */
  }
}

export async function pushStage(patch: Partial<ClassSession>) {
  const res = await fetch("/api/stage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const session = (await res.json()) as ClassSession & { error?: string };
  if (!res.ok || session.error) {
    throw new Error(session.error || `Stage update failed (HTTP ${res.status})`);
  }
  broadcastStage(session);
  return session;
}

export function readLocalStage(): ClassSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAGE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClassSession;
  } catch {
    return null;
  }
}
