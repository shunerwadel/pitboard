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
  sectionTitle?: string;
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
  diagnostics?: {
    hasFolderId: boolean;
    hasCredentials: boolean;
    credentialSource: string | null;
    clientEmail: string | null;
    folderName: string | null;
    scannedFiles: number;
    skippedFiles: number;
    importedNames: string[];
    skippedExamples: string[];
  };
};

export type Citation = {
  docId: string;
  title: string;
  path: string;
  sectionTitle?: string;
  snippet: string;
};

export type ChatMode = "notes" | "notes+extend";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  outside?: string;
  card?: PresentCard;
  createdAt: number;
};

export type ChartPoint = { x: number; y: number; label?: string };

export type ChartSpec = {
  id: string;
  title: string;
  xLabel: string;
  yLabel: string;
  series: { name: string; points: ChartPoint[] }[];
  note?: string;
  provenance: "generated";
};

export type StageMedia =
  | {
      id: string;
      kind: "chart";
      chart: ChartSpec;
      label: "generated";
    }
  | {
      id: string;
      kind: "image";
      imageUrl: string;
      caption: string;
      label: "generated" | "notes";
    };

export type ClassAnchor = {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  source: "upload" | "notes" | "generated" | "sample";
};

export type ClassSession = {
  title: string;
  anchors: ClassAnchor[];
  activeAnchorId: string | null;
  dive: PresentCard | null;
  media: StageMedia | null;
  updatedAt: number;
};

export type NotebookSection = {
  title: string;
  level: number;
  preview: string;
};

export type NotebookDoc = Omit<MaterialDoc, "content"> & {
  sections: NotebookSection[];
};
