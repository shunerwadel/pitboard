export type MaterialDoc = {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  path: string;
  source: "local" | "drive";
  content: string;
  updatedAt: string;
};

export type SearchHit = {
  doc: MaterialDoc;
  score: number;
  snippet: string;
};

export type PresentCard = {
  id: string;
  title: string;
  bullets: string[];
  formula?: string;
  cue?: string;
  sourceTitle: string;
  sourcePath: string;
  topic: string;
};

export type PresentState = {
  card: PresentCard | null;
  updatedAt: number;
  sessionNote: string;
};

export type AskResult = {
  card: PresentCard;
  hits: SearchHit[];
  mode: "retrieved" | "llm";
  message?: string;
};

export type DriveStatus = {
  configured: boolean;
  folderId: string | null;
  mode: "live" | "sample";
  lastSyncAt: string | null;
  fileCount: number;
  message: string;
};
