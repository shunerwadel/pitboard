import fs from "fs/promises";
import path from "path";
import { google, type drive_v3 } from "googleapis";
import { driveCacheRoot } from "./corpus";
import type { DriveStatus } from "./types";

export type { DriveStatus };

type ServiceAccount = Record<string, unknown>;

function normalizeFolderId(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let value = raw.trim().replace(/^["']|["']$/g, "");
  // Accept a full Drive URL pasted by mistake.
  const fromUrl = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (fromUrl) value = fromUrl[1];
  const fromOpen = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fromOpen) value = fromOpen[1];
  return value || null;
}

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

async function listCredentialFiles(): Promise<string[]> {
  const dir = path.join(process.cwd(), "credentials");
  try {
    const entries = await fs.readdir(dir);
    return entries
      .filter((name) => name.toLowerCase().endsWith(".json"))
      .map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

async function loadServiceAccount(): Promise<{
  credentials: ServiceAccount | null;
  source: string | null;
  parseError: string | null;
  clientEmail: string | null;
}> {
  const fileFromEnv =
    process.env.GOOGLE_SERVICE_ACCOUNT_FILE ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "";

  const defaultFile = path.join(process.cwd(), "credentials", "google-service-account.json");
  const discovered = await listCredentialFiles();
  const fileCandidates = [
    fileFromEnv,
    defaultFile,
    ...discovered.filter((p) => p !== defaultFile),
  ].filter(Boolean);

  for (const filePath of fileCandidates) {
    try {
      const raw = await fs.readFile(path.resolve(filePath), "utf8");
      const credentials = tryParseJsonObject(raw);
      if (credentials) {
        return {
          credentials,
          source: `file:${path.basename(filePath)}`,
          parseError: null,
          clientEmail:
            typeof credentials.client_email === "string" ? credentials.client_email : null,
        };
      }
      return {
        credentials: null,
        source: null,
        parseError: `Could not parse JSON in ${filePath}`,
        clientEmail: null,
      };
    } catch {
      /* missing — keep looking */
    }
  }

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson && rawJson.trim()) {
    const credentials = tryParseJsonObject(rawJson);
    if (credentials) {
      return {
        credentials,
        source: "env:GOOGLE_SERVICE_ACCOUNT_JSON",
        parseError: null,
        clientEmail:
          typeof credentials.client_email === "string" ? credentials.client_email : null,
      };
    }
    return {
      credentials: null,
      source: null,
      parseError:
        "GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON. Put the key file in credentials/ instead.",
      clientEmail: null,
    };
  }

  return { credentials: null, source: null, parseError: null, clientEmail: null };
}

function configMessage(opts: {
  folderId: string | null;
  hasCredentials: boolean;
  parseError: string | null;
  source: string | null;
  clientEmail: string | null;
}): string {
  const { folderId, hasCredentials, parseError, source, clientEmail } = opts;
  if (parseError) return parseError;
  if (!folderId && !hasCredentials) {
    return "Using sample local materials. Add GOOGLE_DRIVE_FOLDER_ID to .env.local and place your service-account JSON in credentials/.";
  }
  if (!folderId) {
    return "Service account found, but GOOGLE_DRIVE_FOLDER_ID is missing from .env.local.";
  }
  if (!hasCredentials) {
    return "GOOGLE_DRIVE_FOLDER_ID is set, but no service-account JSON was found. Copy the key to credentials/google-service-account.json and restart npm run dev.";
  }
  const shareHint = clientEmail
    ? ` Share the Drive folder with ${clientEmail} as Viewer.`
    : " Share the Drive folder with the service account email as Viewer.";
  return `Google Drive credentials detected (${source}).${shareHint} Then click Sync Drive.`;
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

export async function getDriveStatus(): Promise<DriveStatus> {
  const folderId = normalizeFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
  const { credentials, source, parseError, clientEmail } = await loadServiceAccount();
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
      clientEmail,
    }),
    diagnostics: {
      hasFolderId: Boolean(folderId),
      hasCredentials: Boolean(credentials),
      credentialSource: source,
      clientEmail,
      folderName: null,
      scannedFiles: 0,
      skippedFiles: 0,
      importedNames: [],
      skippedExamples: [],
    },
  };
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

function isImportable(file: drive_v3.Schema$File): {
  ok: boolean;
  kind: "text" | "doc" | "sheet" | "skip";
  reason?: string;
} {
  const mime = file.mimeType || "";
  const name = (file.name || "").toLowerCase();
  if (mime === "application/vnd.google-apps.folder") {
    return { ok: false, kind: "skip", reason: "folder" };
  }
  if (mime === "application/vnd.google-apps.shortcut") {
    return { ok: false, kind: "skip", reason: "shortcut" };
  }
  if (mime === "application/vnd.google-apps.document") {
    return { ok: true, kind: "doc" };
  }
  if (mime === "application/vnd.google-apps.spreadsheet") {
    return { ok: true, kind: "sheet" };
  }
  if (
    name.endsWith(".md") ||
    name.endsWith(".txt") ||
    name.endsWith(".markdown") ||
    name.endsWith(".csv") ||
    mime === "text/plain" ||
    mime === "text/markdown" ||
    mime === "text/csv"
  ) {
    return { ok: true, kind: "text" };
  }
  return { ok: false, kind: "skip", reason: mime || "unknown type" };
}

async function listChildren(
  drive: drive_v3.Drive,
  parentId: string,
): Promise<drive_v3.Schema$File[]> {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const listed = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id,name,mimeType,shortcutDetails)",
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(listed.data.files ?? []));
    pageToken = listed.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

async function collectImportableFiles(
  drive: drive_v3.Drive,
  rootFolderId: string,
): Promise<{
  files: { file: drive_v3.Schema$File; kind: "text" | "doc" | "sheet" }[];
  scanned: number;
  skippedExamples: string[];
}> {
  const queue = [rootFolderId];
  const seen = new Set<string>();
  const files: { file: drive_v3.Schema$File; kind: "text" | "doc" | "sheet" }[] = [];
  const skippedExamples: string[] = [];
  let scanned = 0;

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = await listChildren(drive, parentId);
    for (const child of children) {
      if (!child.id) continue;
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      scanned += 1;

      // Follow shortcuts to files/folders when possible.
      if (child.mimeType === "application/vnd.google-apps.shortcut") {
        const targetId = child.shortcutDetails?.targetId;
        const targetMime = child.shortcutDetails?.targetMimeType;
        if (targetId && targetMime === "application/vnd.google-apps.folder") {
          queue.push(targetId);
          continue;
        }
        if (targetId) {
          try {
            const target = await drive.files.get({
              fileId: targetId,
              fields: "id,name,mimeType",
              supportsAllDrives: true,
            });
            if (target.data.id) {
              const check = isImportable(target.data);
              if (check.ok && check.kind !== "skip") {
                files.push({ file: target.data, kind: check.kind });
              } else if (skippedExamples.length < 8) {
                skippedExamples.push(
                  `${target.data.name || targetId} (${check.reason || "skipped"})`,
                );
              }
            }
          } catch {
            if (skippedExamples.length < 8) {
              skippedExamples.push(`${child.name || child.id} (broken shortcut)`);
            }
          }
        }
        continue;
      }

      if (child.mimeType === "application/vnd.google-apps.folder") {
        queue.push(child.id);
        continue;
      }

      const check = isImportable(child);
      if (check.ok && check.kind !== "skip") {
        files.push({ file: child, kind: check.kind });
      } else if (skippedExamples.length < 8) {
        skippedExamples.push(`${child.name || child.id} (${check.reason || "skipped"})`);
      }
    }
  }

  return { files, scanned, skippedExamples };
}

export async function syncDriveFolder(): Promise<DriveStatus> {
  const folderId = normalizeFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
  const { credentials, source, parseError, clientEmail } = await loadServiceAccount();

  if (!folderId || !credentials || parseError) {
    return getDriveStatus();
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    let folderName: string | null = null;
    try {
      const meta = await drive.files.get({
        fileId: folderId,
        fields: "id,name,mimeType",
        supportsAllDrives: true,
      });
      folderName = meta.data.name || null;
      if (meta.data.mimeType && meta.data.mimeType !== "application/vnd.google-apps.folder") {
        return {
          configured: true,
          folderId,
          mode: "live",
          lastSyncAt: null,
          fileCount: 0,
          message: `GOOGLE_DRIVE_FOLDER_ID points to a file ("${folderName}"), not a folder. Use the folder URL ID.`,
          diagnostics: {
            hasFolderId: true,
            hasCredentials: true,
            credentialSource: source,
            clientEmail,
            folderName,
            scannedFiles: 0,
            skippedFiles: 0,
            importedNames: [],
            skippedExamples: [],
          },
        };
      }
    } catch (err) {
      return {
        configured: true,
        folderId,
        mode: "live",
        lastSyncAt: null,
        fileCount: 0,
        message: `${friendlyGoogleError(err)}${clientEmail ? ` Share with ${clientEmail}.` : ""}`,
        diagnostics: {
          hasFolderId: true,
          hasCredentials: true,
          credentialSource: source,
          clientEmail,
          folderName: null,
          scannedFiles: 0,
          skippedFiles: 0,
          importedNames: [],
          skippedExamples: [],
        },
      };
    }

    const cache = driveCacheRoot();
    await fs.mkdir(cache, { recursive: true });
    const existing = await fs.readdir(cache);
    for (const name of existing) {
      if (name === ".last-sync.json") continue;
      await fs.rm(path.join(cache, name), { recursive: true, force: true });
    }

    const { files, scanned, skippedExamples } = await collectImportableFiles(drive, folderId);
    const importedNames: string[] = [];

    for (const item of files) {
      const file = item.file;
      if (!file.id || !file.name) continue;

      let body = "";
      if (item.kind === "doc") {
        const exported = await drive.files.export({
          fileId: file.id,
          mimeType: "text/plain",
        });
        body = String(exported.data);
      } else if (item.kind === "sheet") {
        const exported = await drive.files.export({
          fileId: file.id,
          mimeType: "text/csv",
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
      let outName = safe;
      if (item.kind === "doc" && !safe.match(/\.(md|txt)$/i)) outName = `${safe}.md`;
      if (item.kind === "sheet" && !safe.match(/\.csv$/i)) outName = `${safe}.csv`;

      await fs.writeFile(path.join(cache, outName), body, "utf8");
      importedNames.push(outName);
    }

    const at = new Date().toISOString();
    await fs.writeFile(
      path.join(cache, ".last-sync.json"),
      JSON.stringify({ at, count: importedNames.length, folderName }, null, 2),
      "utf8",
    );

    const skipped = Math.max(0, scanned - importedNames.length);
    let message = "";
    if (importedNames.length > 0) {
      message = `Synced ${importedNames.length} file(s) from "${folderName}" (${source}).`;
    } else if (scanned === 0) {
      message = `Connected to folder "${folderName}", but it is empty (including subfolders). Add Docs/.md/.txt files, or confirm you shared the correct folder with ${clientEmail}.`;
    } else {
      message = `Connected to "${folderName}" and scanned ${scanned} item(s), but none were importable text/Docs/Sheets. Skipped examples: ${skippedExamples.join("; ") || "n/a"}.`;
    }

    return {
      configured: true,
      folderId,
      mode: "live",
      lastSyncAt: at,
      fileCount: importedNames.length,
      message,
      diagnostics: {
        hasFolderId: true,
        hasCredentials: true,
        credentialSource: source,
        clientEmail,
        folderName,
        scannedFiles: scanned,
        skippedFiles: skipped,
        importedNames: importedNames.slice(0, 12),
        skippedExamples,
      },
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
      diagnostics: {
        hasFolderId: true,
        hasCredentials: true,
        credentialSource: source,
        clientEmail,
        folderName: null,
        scannedFiles: 0,
        skippedFiles: 0,
        importedNames: [],
        skippedExamples: [],
      },
    };
  }
}
