# POI builder

Builds the points-of-interest file the app shows along the Katy Trail, and publishes it to S3.

This folder is a standalone package with its own `package.json` and `node_modules`, so its dependencies (DuckDB, the AWS SDK) stay out of the app.

## Setup

Requires Node 22.18 or newer (it runs the TypeScript files directly).

```bash
npm ci --prefix scripts/pois
```

## Running

From the repo root:

```bash
npm run build --prefix scripts/pois
```

| Environment variable | Purpose |
|---|---|
| `POI_S3_BUCKET` | Bucket to compare against and publish to. Without it the script only builds the local files. |
| `POI_S3_PREFIX` | Optional folder inside the bucket. |
| `OVERTURE_RELEASE` | Optional. Forces a specific Overture release (e.g. `2026-07-22.0`) instead of the latest. Overture only keeps its most recent releases online. |

Set them on the command line or in `scripts/pois/.env`, which the script loads automatically:

```bash
AWS_PROFILE=mykaty-uploader
POI_S3_BUCKET=mykaty-public
POI_S3_PREFIX=pois
```

AWS credentials and region come from the usual places (`~/.aws`, `AWS_PROFILE`, environment variables). The credentials need `s3:GetObject`, `s3:PutObject` and `s3:ListBucket` on the bucket. Without `ListBucket`, S3 reports a missing file as "access denied" and the very first run fails.

## What a run does

1. Downloads the currently published `pois.json` from S3 and saves a copy to `out/pois.published.json`.
2. Looks up the latest Overture release and fetches the places inside the trail's bounding box, plus the Missouri River line.
3. Filters, de-duplicates and annotates the places (see [Pipeline](#pipeline)).
4. Prints a report: totals, a per-trailhead table, coverage against the State Parks services grid in `constants/waypoints.ts`, and the changes versus the published file.
5. Writes the output files to `out/`.
6. Asks whether to publish. Only `y` or `yes` uploads; anything else does nothing.

It skips the question when the bucket isn't set, when the new file is identical to the published one, or when it isn't running in a terminal (piped, cron, CI). In all three cases nothing is uploaded.

## Reviewing before you publish

The script waits at the publish prompt, so review in another terminal first.

**Change summary.** Printed to the terminal: a table of published vs new counts per category, then every added (`+`) and removed (`-`) place, then places that changed in a way that matters (`~`: renamed, re-categorised, moved 0.05 mi or more, or changed river side). Phone, website and address edits are only counted, because most are formatting noise.

**Line-by-line diff.** Both files are formatted and sorted the same way, so the diff shows only real differences:

```bash
vimdiff scripts/pois/out/pois.published.json scripts/pois/out/pois.json
```

**On a map.** Drag `out/pois.geojson` onto [geojson.io](https://geojson.io) and compare against Google Maps. Markers are coloured by category: food red, lodging blue, grocery green, bike orange. This file is for review only and is never uploaded.

**Drop warnings.** If the total falls by more than 20%, or any category by more than 30%, against the published file, `!! WARNING` lines appear under the change table and again above the publish prompt. That usually means something upstream broke (Overture renamed a category, changed its schema, or shipped a bad release) rather than businesses closing. Don't publish until you know why. The thresholds are in `config.ts`.

## Output files

All in `out/`, which is gitignored.

| File | Uploaded | Purpose |
|---|---|---|
| `pois.json` | yes | The data the app uses. |
| `manifest.json` | yes, last | Timestamp, count and SHA-256 of `pois.json`, so the app can check for updates without downloading the full file. |
| `pois.geojson` | no | For viewing on geojson.io. |
| `pois.published.json` | no | Copy of what is live on S3, for diffing. Deleted when there is no published file. |

Each entry in `pois.json`:

```jsonc
{
  "id": "…",                  // Overture id, stable across releases; "manual:…" for hand-added places
  "name": "Root Food + Wine",
  "category": "food",          // food | lodging | grocery | bike
  "subcategory": "restaurant",
  "lat": 38.57, "lng": -90.88,
  "trailIndex": 1234,          // index into constants/trailPoints.ts of the nearest trail point
  "trailMile": 38.2,           // trail miles from Machens
  "milesFromTrail": 0.3,
  "nearestTrailhead": "Augusta",
  "phone": "…", "website": "…", "address": "…",   // when known
  "acrossRiver": true          // only on places reached by a bridge
}
```

The app must show the attribution string from the file (`© Overture Maps Foundation`) somewhere, such as an about screen. That is the only licence requirement.

## Tuning

**`config.ts`** holds the corridor width, minimum Overture confidence (0.5), de-duplication distance, drop-warning thresholds, and the map from Overture categories to the app's four categories. To include a new kind of place, add its Overture category to `CATEGORY_MAP`.

**`bridges.json`** lists towns on the far side of the Missouri River that riders can actually reach. Places across the river are normally dropped; inside one of these circles they are kept and flagged `acrossRiver`. At the current 2-mile corridor only Hermann and Jefferson City have any effect; Washington is further than 2 miles from the trail.

**`overrides.json`** is for hand corrections, keyed by the `id` in `pois.json`:

```json
{
  "remove": [{ "id": "…", "reason": "closed in 2026" }],
  "patch": { "…": { "category": "bike", "subcategory": "shop" } },
  "add": [
    {
      "name": "Example Cafe",
      "category": "food",
      "subcategory": "cafe",
      "lat": 38.0,
      "lng": -91.0,
      "phone": "+1…",
      "website": "https://…"
    }
  ]
}
```

Overture gives each place one primary category, so combined businesses (a cafe that is also a bike shop) land in only one, and can flip between releases. Use `patch` to pin them. Overture is also thin in the smallest towns (Hartsburg has nothing); use `add` for those. The script warns when an override id no longer exists in the data.
