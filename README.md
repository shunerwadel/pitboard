# Pitboard

Hybrid classroom co-pilot for race vehicle engineering:

- **Notebook** of your lecture notes (local + optional Google Drive)
- **Teaching chat** grounded in those notes with citations
- **Projector** with 3–5 light visual anchors + live deep dives
- **AI extend** for outside analogies, charts, and diagrams — preview first, then approve & push

## Class workflow

1. Open the instructor console; open **Open projector** on the second display.
2. Select an **anchor** to orient the room.
3. Ask in chat (or click a notebook section) → review the grounded answer.
4. **Push deep dive** when you want detail on the projector.
5. Optionally **Analogy / Chart / Diagram**, then **Approve & push** from the tray.
6. Clear dive/media and move to the next topic.

## Modes

- **Notes only** — answers and citations from your corpus
- **Notes + AI extend** — same, plus a labeled Outside AI block when useful

## Local development

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317) (instructor) and `/display` (projector).

`npm run dev` frees port **4317** before starting. If you still see `EADDRINUSE`, run `npm run dev:clean` or close the other terminal that is already running Pitboard (a leftover `node` / `next dev` process is almost always the cause).

### Secrets (`.env.local`)

See [`.env.example`](./.env.example). Recommended on Windows: put the service-account JSON at `credentials/google-service-account.json` and set only `GOOGLE_DRIVE_FOLDER_ID`.

### OpenAI setup (local)

1. Create a **Platform** API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (not ChatGPT Plus).
2. Put billing credits on the OpenAI account if prompted.
3. In the project root:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

4. Set one line (no quotes):

```env
OPENAI_API_KEY=sk-your-key-here
```

5. Restart `npm run dev`. The chat header should say **OpenAI connected**.

Without a key, grounded notebook chat still works; Chart uses an offline sketch; Diagram shows a placeholder.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 4317 |
| `npm run build` | Production build |
| `npm start` | Start on port 4317 |
| `npm run lint` | ESLint |
