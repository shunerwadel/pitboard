# Pitboard

Classroom co-pilot for race vehicle engineering courses. Introduce a topic, pull grounded notes from your allowed materials, and push a clean card to a second browser tab on the projector while you talk.

## How to use in class

1. Open the instructor console (home page) on your laptop.
2. Click **Open projector tab** and drag that window to the projector / second display.
3. Ask for a topic (or click a quick prompt) → review the card → **Push to projector**.
4. Keep talking; ask for “more”, a related topic, or clear the board when you move on.

The display listens over `BroadcastChannel` / `localStorage` (same browser) and also polls the server, so two tabs stay in sync.

## Materials

Sample lecture notes live in [`materials/`](./materials/). Replace or extend them with your own Markdown / text files.

### Option A — Google Drive Desktop (simplest)

Sync your Drive course folder to disk, then either:

- copy/symlink files into `materials/`, or
- set `MATERIALS_DIR` to the synced folder path when you start the app.

### Option B — Google Drive API (live sync button)

1. Create a Google Cloud service account and share the Drive folder with that account (Viewer).
2. Add secrets (see below):
   - `GOOGLE_DRIVE_FOLDER_ID` — the folder ID from the Drive URL
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the full service account JSON key
3. In the instructor console, click **Sync Drive**. Text / Docs export into `materials/.drive-cache/`.

Without those secrets, Pitboard runs on the bundled sample corpus.

### Optional LLM polish

If `OPENAI_API_KEY` is set, answers are refined into tighter teaching cards. Without it, cards are built directly from retrieved notes (still citation-backed).

## Local development

```bash
npm install
npm run dev
```

Dev server defaults to [http://127.0.0.1:3467](http://127.0.0.1:3467).

```bash
npm run build && npm start
```

## Scripts

| Script        | Purpose                |
| ------------- | ---------------------- |
| `npm run dev` | Dev server on port 3467 |
| `npm run build` | Production build     |
| `npm start`   | Start on port 3467     |
| `npm run lint` | ESLint                |
