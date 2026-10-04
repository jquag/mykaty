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
| `OSRM_URL` | Optional. OSRM server with a bike profile, used for route distances. Defaults to the public FOSSGIS server, `https://routing.openstreetmap.de/routed-bike`. |

Set them on the command line or in `scripts/pois/.env`, which the script loads automatically:

```bash
AWS_PROFILE=mykaty-uploader
POI_S3_BUCKET=mykaty-public
POI_S3_PREFIX=pois
```

AWS credentials and region come from the usual places (`~/.aws`, `AWS_PROFILE`, environment variables). The credentials need `s3:GetObject`, `s3:PutObject` and `s3:ListBucket` on the bucket. Without `ListBucket`, S3 reports a missing file as "access denied" and the very first run fails.

## What a run does

1. Downloads the currently published `pois.json` from S3 and saves a copy to `out/pois.published.json`, and downloads the published `routes.json` for reuse.
2. Looks up the latest Overture release and fetches the places inside the trail's bounding box, plus the Missouri River line.
3. Filters, de-duplicates and annotates the places (see [Pipeline](#pipeline)).
4. Measures each place's bike route from the trail (see [Route distances](#route-distances)). This takes about five minutes.
5. Fetches the route line for each new or re-routed place (see [Route lines](#route-lines)).
6. Prints a report: totals, a per-trailhead table, coverage against the State Parks services grid in `constants/waypoints.ts`, and the changes versus the published file.
7. Writes the output files to `out/`.
8. Asks whether to publish. Only `y` or `yes` uploads; anything else does nothing.

It skips the question when the bucket isn't set, when the new files are identical to the published ones, or when it isn't running in a terminal (piped, cron, CI). In all three cases nothing is uploaded.

## Reviewing before you publish

The script waits at the publish prompt, so review in another terminal first.

**Change summary.** Printed to the terminal: a table of published vs new counts per category, then every added (`+`) and removed (`-`) place, then places that changed in a way that matters (`~`: renamed, re-categorised, moved 0.05 mi or more, changed river side, or distance from the trail changed by 0.25 mi or more). Phone, website and address edits are only counted, because most are formatting noise.

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
| `routes.json` | yes | The bike route from the trail to each place, for drawing on the map. |
| `manifest.json` | yes, last | Timestamp, count and SHA-256 of `pois.json`, plus the same for `routes.json` under `routes`, so the app can check for updates without downloading the full files. |
| `pois.geojson` | no | For viewing on geojson.io, with each place's route line in its category colour. |
| `pois.published.json` | no | Copy of what is live on S3, for diffing. Deleted when there is no published file. |

Each entry in `pois.json`:

```jsonc
{
  "id": "…",                  // Overture id, stable across releases; "manual:…" for hand-added places
  "name": "Root Food + Wine",
  "category": "food",          // food | lodging | grocery | bike
  "subcategory": "restaurant",
  "lat": 38.57, "lng": -90.88,
  "trailIndex": 1234,          // index into constants/trailPoints.ts of where to leave the trail
  "trailMile": 38.2,           // trail miles from Machens
  "milesFromTrail": 0.3,       // bike route from the trail
  "nearestTrailhead": "Augusta",
  "phone": "…", "website": "…", "address": "…",   // when known
  "acrossRiver": true          // only on places reached by a bridge
}
```

The app must show the attribution string from the file (`© Overture Maps Foundation, © OpenStreetMap contributors`) somewhere, such as an about screen. That is the only licence requirement. The OpenStreetMap credit covers the route distances.

`routes.json` shares `generatedAt` with `pois.json`:

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "…",
  "routes": {
    "…": "ezsnFbdvaP…"         // keyed by pois.json id: Google encoded polyline, precision 5
  }
}
```

A line starts where the rider leaves the trail (`trailIndex`) and ends on the road nearest the place, so it can stop up to 0.1 mi short of the marker. A place has no entry if the server couldn't return its line; the run lists these.

## Route distances

`milesFromTrail` is the shortest bike route from the trail, so a place across a highway or up a long driveway shows its real distance. The script samples the trail every 0.2 mi, sends OSRM table requests from the samples within 2 mi of each place, and keeps the shortest. The winning sample becomes the place's `trailIndex`, `trailMile` and `nearestTrailhead`, so a place is listed where riders actually leave the trail. Places more than 2 mi away by bike are dropped, even when they are within 2 mi in a straight line.

OSRM moves each point onto the nearest way it can route a bike on. When that way is more than 0.1 mi from the place (typically a gas station on a highway bikes can't use), the place is treated as unreachable by bike and dropped, as are places OSRM finds no route to. The run lists every place dropped for having no route so you can check them; to keep one, move it onto its entrance with a `patch` in `overrides.json`.

The public FOSSGIS server allows one request per second and no heavy use. A run makes about 30 requests, spaced a second apart, and retries failures with backoff. If the server is unavailable, the build stops instead of publishing straight-line distances. To use your own server instead, run OSRM in Docker with the bike profile on a Missouri extract from Geofabrik, then set `OSRM_URL`.

## Route lines

Each line takes its own request, so the first run with route lines makes about 900 of them, which takes about 17 minutes at one per second. After that, a place's line is copied from the published `routes.json` when its location, `trailIndex` and `milesFromTrail` (within 0.05 mi) are unchanged. Only new places and places whose route changed are fetched, usually a few dozen a run. Lines are only reused from a `routes.json` published alongside the current `pois.json`.

## Tuning

**`config.ts`** holds the corridor width (`CORRIDOR_MILES`, the longest bike route from the trail that is kept), minimum Overture confidence (0.5), de-duplication distance, drop-warning thresholds, and the map from Overture categories to the app's four categories. To include a new kind of place, add its Overture category to `CATEGORY_MAP`.

**`bridges.json`** lists towns on the far side of the Missouri River that riders can actually reach. Places across the river are normally dropped; inside one of these circles they are kept and flagged `acrossRiver`. Crossing the bridge alone takes up most of the 2-mile corridor, so each town has its own `maxRouteMiles`, the longest bike route kept there. Places still have to be within the corridor in a straight line. At the current 2-mile corridor only Hermann and Jefferson City have any effect; Washington is further than 2 miles from the trail.

**`overrides.json`** is for hand corrections, keyed by the `id` in `pois.json`:

```json
{
  "remove": [{ "id": "…", "reason": "closed in 2026" }],
  "patch": { "…": { "category": "bike", "subcategory": "shop", "reason": "also a bike shop" } },
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
