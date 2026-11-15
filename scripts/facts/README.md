# Fun facts

The facts the home screen's daily card rotates through. Edit `facts.json`, put any photos in `images/`, and publish to S3. The app picks up the change within about a day, without an app update.

The app also ships with `facts.json` as it was at build time. It shows that copy until it has downloaded the published one once.

## Setup

Requires Node 22.18 or newer.

```bash
npm ci --prefix scripts/facts
```

`scripts/facts/.env` (gitignored) holds the S3 settings:

```bash
AWS_PROFILE=mykaty-uploader
FACTS_S3_BUCKET=mykaty-public
FACTS_S3_PREFIX=facts
```

The credentials need `s3:GetObject`, `s3:PutObject` and `s3:ListBucket` on the bucket. The prefix has to match `FACTS_BASE_URL` in `utils/fun-facts.ts`.

## Writing a fact

```jsonc
{
  "id": "rocheport-tunnel",          // unique, lowercase words joined by hyphens; keep it once published
  "title": "Rocheport Tunnel",       // optional; facts at a trailhead default to its name
  "text": "The only tunnel on the trail…",
  "image": "rocheport-tunnel.jpg",   // optional; a file in images/
  "location": { "lat": 38.97, "lng": -92.55 }   // optional; or { "trailhead": "Rocheport" }
}
```

- **Location** adds a "View on map" link. A `trailhead` must match a name in `constants/waypoints.ts`, and the map opens that trailhead. A `lat`/`lng` must be within 0.5 mi of the trail, and the map drops a pin there labelled with the title.
- **Image**: without one, a fact at a trailhead uses the trailhead's photo, and any other fact shows a lightbulb. The card shows images at 96×96, so a square-ish JPEG around 600 px wide is plenty. Anything over 500 KB gets a warning.
- **Image names are permanent.** Once a photo is published, the CDN and the app keep it forever under that name. To change a photo, save it under a new name. The script refuses to publish a changed file under a published name.
- **Order** in the file is the rotation order. Each day shows the next fact, the same for everyone.

## Publishing

From the repo root:

```bash
npm run publish --prefix scripts/facts
```

1. It checks every fact and stops on errors: duplicate or badly formed ids, missing text, unknown trailheads, spots far from the trail, missing images, and keys it doesn't recognise. Warnings (large images, images no fact uses) don't stop it.
2. It downloads the published `facts.json` to `out/facts.published.json` and lists the added (`+`), removed (`-`) and changed (`~`) facts.
3. It writes `out/facts.json` and `out/manifest.json`.
4. It asks before uploading. Only `y` or `yes` publishes: first any new images, then `facts.json`, then `manifest.json`.

It skips the question when the bucket isn't set, when nothing changed, or when it isn't running in a terminal. Without the bucket it is a quick way to check your edits.

## Published files

| File | Cache | Purpose |
|---|---|---|
| `manifest.json` | 1 hour | `generatedAt`, the SHA-256 of `facts.json`, and every published image with its SHA-256. The app checks this at most once a day. |
| `facts.json` | 1 hour | `schemaVersion`, `generatedAt` and the facts. |
| `images/<name>` | forever | Photos. The app saves them to disk ahead of time, so they show without signal. |
