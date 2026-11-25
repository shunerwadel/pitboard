# Course materials

Drop lecture notes here as Markdown (`.md`) or plain text (`.txt`).

**Split outline notes into one file per H3** (`* ###` / `###`):

```bash
npm run split:notes -- path\to\outline.md
# or: npx --yes tsx scripts/split-outline-notes.ts path\to\outline.md materials
```

**Local / Google Drive Desktop:** sync your Drive folder into this directory, or set `MATERIALS_DIR` to the synced path.

**Google Drive API:** set `GOOGLE_DRIVE_FOLDER_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON`, then use **Sync Drive** in the instructor console. Synced files land in `materials/.drive-cache/`.

Front matter is optional:

```md
---
title: Tire load sensitivity
topic: tires
tags: [grip, load transfer]
---
```
