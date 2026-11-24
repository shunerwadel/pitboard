import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import { driveCacheRoot } from "./corpus";
import type { DriveStatus } from "./types";

export type { DriveStatus };

type ServiceAccount = Record<string, unknown>;

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function tryParseJsonObject(raw: string): ServiceAccount | null {
  const candidates = [
    raw.trim(),
    stripWrappingQuotes(raw),
    stripWrappingQuotes(raw).replace(/\\n/g, "\n"),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as ServiceAccount;
      }
    } catch {
      /* try next */
    }
  }

  // Some editors save the JSON as base64 in the env var.
  try {
    const decoded = Buffer.from(stripWrappingQuotes(raw), "base64").toString("utf8");
    if (decoded.trim().startsWith("{")) {
      return tryParseJsonObject(decoded);
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function loadServiceAccount(): Promise<{
  credentials: ServiceAccount | null;
  source: "env-json" | "env-file" | "default-file" | null;
  parseError: string | null;
}> {
  const fileFromEnv =
    process.env.GOOGLE_SERVICE_ACCOUNT_FILE ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "";

  const defaultFile = path.join(process.cwd(), "credentials", "google-service-account.json");

  const fileCandidates = [fileFromEnv, defaultFile].filter(Boolean);

  for (const filePath of fileCandidates) {
    try {
      const raw = await fs.readFile(path.resolve(filePath), "utf8");
      const credentials = tryParseJsonObject(raw);
      if (credentials) {
        return {
          credentials,
          source: filePath === defaultFile ? "default-file" : "env-file",
          parseError: null,
        };
      }
      return {
        credentials: null,
        source: null,
        parseError: `Could not parse JSON in ${filePath}`,
      };
    } catch {
      // File missing — keep looking.
    }
  }

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson && rawJson.trim()) {
    const credentials = tryParseJsonObject(rawJson);
    if (credentials) {
      return { credentials, source: "env-json", parseError: null };
    }
    return {
      credentials: null,
      source: null,
      parseError:
        "GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON. Prefer a credentials file instead (see .env.example).",
    };
  }

  return { credentials: null, source: null, parseError: null };
}

function configMessage(opts: {
  folderId: string | null;
  hasCredentials: boolean;
  parseError: string | null;
  source: string | null;
}): string {
  const { folderId, hasCredentials, parseError, source } = opts;
  if (parseError) return parseError;
  if (!folderId && !hasCredentials) {
    return "Using sample local materials. Add GOOGLE_DRIVE_FOLDER_ID and a service-account JSON file (see .env.example).";
  }
  if (!folderId) {
    return "Service account found, but GOOGLE_DRIVE_FOLDER_ID is missing.";
  }
  if (!hasCredentials) {
    return "GOOGLE_DRIVE_FOLDER_ID is set, but no service-account credentials were found. Put the JSON at credentials/google-service-account.json or set GOOGLE_SERVICE_ACCOUNT_FILE.";
  }
  return `Google Drive credentials detected (${source}). Sync to refresh materials. Share the folder with the service account as Viewer.`;
}

export async function getDriveStatus(): Promise<DriveStatus> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
  const { credentials, source, parseError } = await loadServiceAccount();
  const { count, lastSyncAt } = await countCachedFiles();
  const configured = Boolean(folderId && credentials && !parseError);

  return {
    configured,
    folderId,
    mode: configured ? "live" : "sample",
    lastSyncAt,
    fileCount: count,
    message: configMessage({
      folderId,
      hasCredentials: Boolean(credentials),
      parseError,
      source,
    }),
  };
}

async function countCachedFiles(): Promise<{ count: number; lastSyncAt: string | null }> {
  const root = driveCacheRoot();
  const marker = path.join(root, ".last-sync.json");
  try {
    const raw = await fs.readFile(marker, "utf8");
    const parsed = JSON.parse(raw) as { at?: string; count?: number };
    return { count: parsed.count ?? 0, lastSyncAt: parsed.at ?? null };
  } catch {
    return { count: 0, lastSyncAt: null };
  }
}

function friendlyGoogleError(err: unknown): string {
  const anyErr = err as {
    message?: string;
    code?: number | string;
    errors?: { message?: string; reason?: string }[];
    response?: { status?: number; data?: { error?: { message?: string } } };
  };
  const apiMessage =
    anyErr.response?.data?.error?.message ||
    anyErr.errors?.[0]?.message ||
    anyErr.message ||
    "Unknown Google Drive error";
  const reason = anyErr.errors?.[0]?.reason;
  const status = anyErr.response?.status || anyErr.code;

  if (String(apiMessage).includes("File not found") || reason === "notFound") {
    return "Drive folder not found for this service account. Share the folder with the service account email as Viewer, and check GOOGLE_DRIVE_FOLDER_ID.";
  }
  if (reason === "authError" || status === 401) {
    return "Google auth failed. Check that the service-account JSON is complete and the Drive API is enabled in that GCP project.";
  }
  if (status === 403) {
    return `Google Drive permission denied: ${apiMessage}. Enable the Drive API and share the folder with the service account.`;
  }
  return `Drive sync failed: ${apiMessage}`;
}

export async function syncDriveFolder(): Promise<DriveStatus> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  const { credentials, source, parseError } = await loadServiceAccount();

  if (!folderId || !credentials || parseError) {
    return getDriveStatus();
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });
    const cache = driveCacheRoot();
    await fs.mkdir(cache, { recursive: true });

    const existing = await fs.readdir(cache);
    for (const name of existing) {
      if (name === ".last-sync.json") continue;
      await fs.rm(path.join(cache, name), { recursive: true, force: true });
    }

    const listed = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime)",
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    let count = 0;
    for (const file of listed.data.files ?? []) {
      if (!file.id || !file.name) continue;
      const mime = file.mimeType || "";
      const lower = file.name.toLowerCase();
      const isText =
        lower.endsWith(".md") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".markdown") ||
        mime === "text/plain" ||
        mime === "text/markdown";
      const isGoogleDoc = mime === "application/vnd.google-apps.document";
      if (!isText && !isGoogleDoc) continue;

      let body = "";
      if (isGoogleDoc) {
        const exported = await drive.files.export({
          fileId: file.id,
          mimeType: "text/plain",
        });
        body = String(exported.data);
      } else {
        const downloaded = await drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "text" },
        );
        body = String(downloaded.data);
      }

      const safe = file.name.replace(/[^\w.\- ]+/g, "_");
      const outName = isGoogleDoc && !safe.match(/\.(md|txt)$/i) ? `${safe}.md` : safe;
      await fs.writeFile(path.join(cache, outName), body, "utf8");
      count += 1;
    }

    const at = new Date().toISOString();
    await fs.writeFile(
      path.join(cache, ".last-sync.json"),
      JSON.stringify({ at, count }, null, 2),
      "utf8",
    );

    return {
      configured: true,
      folderId,
      mode: "live",
      lastSyncAt: at,
      fileCount: count,
      message:
        count > 0
          ? `Synced ${count} text file(s) from Google Drive (${source}).`
          : "Connected to Drive, but found 0 .md/.txt/Google Docs in that folder. Add text files or Docs, then sync again.",
    };
  } catch (err) {
    const { count, lastSyncAt } = await countCachedFiles();
    return {
      configured: true,
      folderId,
      mode: "live",
      lastSyncAt,
      fileCount: count,
      message: friendlyGoogleError(err),
    };
  }
}
