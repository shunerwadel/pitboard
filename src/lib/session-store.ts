import type { ClassSession } from "./types";
import { sampleClassSession } from "./sample-class";

const globalStore = globalThis as typeof globalThis & {
  __pitboardSession?: ClassSession;
};

export function getSession(): ClassSession {
  if (!globalStore.__pitboardSession) {
    globalStore.__pitboardSession = {
      ...sampleClassSession(),
      updatedAt: Date.now(),
    };
  }
  return globalStore.__pitboardSession;
}

export function setSession(next: ClassSession): ClassSession {
  globalStore.__pitboardSession = { ...next, updatedAt: Date.now() };
  return globalStore.__pitboardSession;
}

export function patchSession(patch: Partial<ClassSession>): ClassSession {
  const current = getSession();
  return setSession({ ...current, ...patch });
}
