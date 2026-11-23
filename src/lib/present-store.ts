import type { PresentState } from "./types";

const globalStore = globalThis as typeof globalThis & {
  __pitboardPresent?: PresentState;
};

export function getPresentState(): PresentState {
  return (
    globalStore.__pitboardPresent ?? {
      card: null,
      updatedAt: 0,
      sessionNote: "",
    }
  );
}

export function setPresentState(next: PresentState): PresentState {
  globalStore.__pitboardPresent = next;
  return next;
}
