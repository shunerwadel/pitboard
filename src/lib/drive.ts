import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import { driveCacheRoot } from "./corpus";
import type { DriveStatus } from "./types";

export type { DriveStatus };

function parseServiceAccount(): object | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as object;
  } catch {
    return null;
  }
}

export function getDriveStatusSync(fileCount = 0, lastSyncAt: string | null = null): DriveStatus {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
  const sa = parseServiceAccount();
  const configured = Boolean(folderId && sa);
  return {
    configured,
    folderId,
    mode: configured ? "live" : "sample",
    lastSyncAt,
    fileCount,
    message: configured
      ? "Google Drive credentials detected. Sync to refresh materials."
      : "Using sample local materials. Add GOOGLE_DRIVE_FOLDER_ID and GOOGLE_SERVICE_ACCOUNT_JSON to pull a live Drive folder.",
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

export async function getDriveStatus(): Promise<DriveStatus> {
  const { count, lastSyncAt } = await countCachedFiles();
  return getDriveStatusSync(count, lastSyncAt);
}

export async function syncDriveFolder(): Promise<DriveStatus> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const sa = parseServiceAccount();
  if (!folderId || !sa) {
    return getDriveStatus();
  }

  const auth = new google.auth.GoogleAuth({
    credentials: sa,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });
  const cache = driveCacheRoot();
  await fs.mkdir(cache, { recursive: true });

  // Clear previous text cache (keep directory)
  const existing = await fs.readdir(cache);
  for (const name of existing) {
    if (name === ".last-sync.json") continue;
    await fs.rm(path.join(cache, name), { recursive: true, force: true });
  }

  const listed = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime)",
    pageSize: 100,
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
    message: `Synced ${count} text file(s) from Google Drive.`,
  };
}
