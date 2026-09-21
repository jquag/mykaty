import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createInterface } from "node:readline/promises";
import { trailPoints } from "../../constants/trailPoints.ts";
import { waypoints } from "../../constants/waypoints.ts";
import type { TrailheadServices } from "../../constants/waypoints.ts";
import {
	ATTRIBUTION,
	CLOSED_STATUSES,
	CORRIDOR_MILES,
	DEDUPE_MILES,
	MAX_CATEGORY_DROP,
	MAX_TOTAL_DROP,
	MIN_CONFIDENCE,
	S3_MANIFEST_KEY,
	S3_POIS_KEY,
	SCHEMA_VERSION,
	categorize,
} from "./config.ts";
import type { PoiCategory } from "./config.ts";
import { boundingBox, cumulativeMiles, haversineMiles, nearestOnLine, normalizeName, segmentsIntersect } from "./geo.ts";
import type { LatLng } from "./geo.ts";
import { fetchOverture } from "./overture.ts";
import { downloadPublished, s3Configured, s3Target, uploadJson } from "./s3.ts";

interface Poi {
	id: string;
	name: string;
	category: PoiCategory;
	subcategory: string;
	lat: number;
	lng: number;
	trailIndex: number;
	trailMile: number;
	milesFromTrail: number;
	nearestTrailhead: string;
	phone?: string;
	website?: string;
	address?: string;
	acrossRiver?: true;
}

type PoiDraft = Pick<Poi, "id" | "name" | "category" | "subcategory" | "lat" | "lng" | "phone" | "website" | "address">;

interface PoiFile {
	schemaVersion: number;
	generatedAt: string;
	overtureRelease: string;
	attribution: string;
	pois: Poi[];
}

interface BridgeZone extends LatLng {
	name: string;
	radiusMiles: number;
}

interface Overrides {
	remove: { id: string; reason?: string }[];
	patch: Record<string, Partial<PoiDraft>>;
	add: (Omit<PoiDraft, "id"> & { id?: string })[];
}

const DIR = import.meta.dirname;
const OUT_DIR = join(DIR, "out");
const POIS_PATH = join(OUT_DIR, S3_POIS_KEY);
const MANIFEST_PATH = join(OUT_DIR, S3_MANIFEST_KEY);
const GEOJSON_PATH = join(OUT_DIR, "pois.geojson");
const PUBLISHED_PATH = join(OUT_DIR, "pois.published.json");

const CATEGORIES: PoiCategory[] = ["food", "lodging", "grocery", "bike"];
const MARKER_COLORS: Record<PoiCategory, string> = { food: "#d9534f", lodging: "#5b6abf", grocery: "#3c9d5d", bike: "#e0a030" };
const SERVICE_MATCHERS: Partial<Record<keyof TrailheadServices, (poi: Poi) => boolean>> = {
	restaurant: poi => poi.category === "food",
	foodGrocery: poi => poi.category === "grocery",
	lodging: poi => poi.category === "lodging" && poi.subcategory !== "camping",
	camping: poi => poi.subcategory === "camping",
	bikeShop: poi => poi.category === "bike",
};
// Trail vertices sit roughly 100 ft apart, so every 5th is plenty when searching for a same-bank approach
const CANDIDATE_STRIDE = 5;
const CONTACT_FIELDS = ["phone", "website", "address"] as const;
const MOVED_MILES = 0.05;

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
const round = (value: number, digits: number) => Number(value.toFixed(digits));

const trailMiles = cumulativeMiles(trailPoints);
const waypointIndices = waypoints.map(wp => nearestOnLine(wp, trailPoints, Infinity)!.index);
const bbox = boundingBox(trailPoints, CORRIDOR_MILES);
const bridges = readJson<BridgeZone[]>(join(DIR, "bridges.json"));
const overrides = readJson<Overrides>(join(DIR, "overrides.json"));

const { release, places, river } = await fetchOverture(bbox);

function crossesRiver(a: LatLng, b: LatLng) {
	return river.some(segment => segmentsIntersect([a, b], segment));
}

// Finds the closest trail point reachable without crossing the river; far-bank places survive only inside a bridge zone
function locate(point: LatLng, maxMiles: number, checkRiver: boolean) {
	const nearest = nearestOnLine(point, trailPoints, maxMiles);
	if (!nearest) return null;
	if (!checkRiver || !crossesRiver(point, trailPoints[nearest.index])) return { ...nearest, acrossRiver: false };

	const candidates: { index: number; miles: number }[] = [];
	for (let i = 0; i < trailPoints.length; i += CANDIDATE_STRIDE) {
		const miles = haversineMiles(point, trailPoints[i]);
		if (miles <= maxMiles) candidates.push({ index: i, miles });
	}
	candidates.sort((a, b) => a.miles - b.miles);
	const sameBank = candidates.find(c => !crossesRiver(point, trailPoints[c.index]));
	if (sameBank) return { ...sameBank, acrossRiver: false };

	const inBridgeZone = bridges.some(zone => haversineMiles(point, zone) <= zone.radiusMiles);
	return inBridgeZone ? { ...nearest, acrossRiver: true } : null;
}

function nearestTrailhead(trailIndex: number) {
	let best = 0;
	for (let i = 1; i < waypoints.length; i++) {
		const miles = Math.abs(trailMiles[waypointIndices[i]] - trailMiles[trailIndex]);
		if (miles < Math.abs(trailMiles[waypointIndices[best]] - trailMiles[trailIndex])) best = i;
	}
	return waypoints[best].name;
}

function finalize(draft: PoiDraft, location: NonNullable<ReturnType<typeof locate>>): Poi {
	return {
		id: draft.id,
		name: draft.name,
		category: draft.category,
		subcategory: draft.subcategory,
		lat: round(draft.lat, 6),
		lng: round(draft.lng, 6),
		trailIndex: location.index,
		trailMile: round(trailMiles[location.index], 1),
		milesFromTrail: round(location.miles, 2),
		nearestTrailhead: nearestTrailhead(location.index),
		...(draft.phone && { phone: draft.phone }),
		...(draft.website && { website: draft.website }),
		...(draft.address && { address: draft.address }),
		...(location.acrossRiver && { acrossRiver: true as const }),
	};
}

function collectDrafts() {
	const removed = new Set(overrides.remove.map(entry => entry.id));
	const seenIds = new Set<string>();
	const drafts: (PoiDraft & { confidence: number })[] = [];
	const dropped = { uncategorized: 0, unnamed: 0, closed: 0, lowConfidence: 0, removed: 0 };

	for (const place of places) {
		seenIds.add(place.id);
		const mapped = categorize(place.category);
		if (!mapped) dropped.uncategorized++;
		else if (!place.name?.trim()) dropped.unnamed++;
		else if (place.operatingStatus && CLOSED_STATUSES.includes(place.operatingStatus)) dropped.closed++;
		else if (place.confidence < MIN_CONFIDENCE) dropped.lowConfidence++;
		else if (removed.has(place.id)) dropped.removed++;
		else {
			drafts.push({
				id: place.id,
				name: place.name.trim(),
				category: mapped[0],
				subcategory: mapped[1],
				lat: place.lat,
				lng: place.lng,
				phone: place.phone ?? undefined,
				website: place.website ?? undefined,
				address: [place.street, place.locality].filter(Boolean).join(", ") || undefined,
				confidence: place.confidence,
			});
		}
	}

	for (const id of [...removed, ...Object.keys(overrides.patch)]) {
		if (!seenIds.has(id)) console.warn(`warning: override references unknown id ${id}`);
	}
	return { drafts, dropped };
}

function dedupe<T extends PoiDraft & { confidence: number }>(drafts: T[]) {
	const groups = new Map<string, T[]>();
	for (const draft of drafts) {
		const key = `${draft.category}:${normalizeName(draft.name)}`;
		groups.set(key, [...(groups.get(key) ?? []), draft]);
	}

	const kept: T[] = [];
	let merged = 0;
	for (const group of groups.values()) {
		group.sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
		const winners: T[] = [];
		for (const draft of group) {
			const winner = winners.find(w => haversineMiles(w, draft) <= DEDUPE_MILES);
			if (!winner) {
				winners.push(draft);
				continue;
			}
			winner.phone ??= draft.phone;
			winner.website ??= draft.website;
			winner.address ??= draft.address;
			merged++;
		}
		kept.push(...winners);
	}
	return { kept, merged };
}

function buildPois() {
	const { drafts, dropped } = collectDrafts();

	let outsideCorridor = 0;
	let farBank = 0;
	const inCorridor = drafts.filter(draft => {
		if (!nearestOnLine(draft, trailPoints, CORRIDOR_MILES)) {
			outsideCorridor++;
			return false;
		}
		if (!locate(draft, CORRIDOR_MILES, true)) {
			farBank++;
			return false;
		}
		return true;
	});

	const { kept, merged } = dedupe(inCorridor);

	const pois: Poi[] = [];
	for (const draft of kept) {
		const patched = { ...draft, ...overrides.patch[draft.id] };
		const location = locate(patched, CORRIDOR_MILES, true);
		if (location) pois.push(finalize(patched, location));
		else console.warn(`warning: patch moved ${draft.id} (${draft.name}) out of the corridor; dropped`);
	}
	for (const entry of overrides.add) {
		const id = entry.id ?? `manual:${normalizeName(entry.name)}`;
		pois.push(finalize({ ...entry, id }, locate(entry, Infinity, false)!));
	}

	pois.sort((a, b) => a.trailMile - b.trailMile || a.id.localeCompare(b.id));

	console.log(`overture places fetched: ${places.length}`);
	console.log(`dropped: ${Object.entries(dropped).map(([k, v]) => `${k} ${v}`).join(", ")}, outside corridor ${outsideCorridor}, far bank ${farBank}, duplicates ${merged}`);
	console.log(`manual additions: ${overrides.add.length}`);
	return pois;
}

function countBy<T>(items: T[], key: (item: T) => string) {
	const counts: Record<string, number> = {};
	for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
	return counts;
}

function report(pois: Poi[]) {
	const counts = countBy(pois, p => p.category);
	console.log(`\n=== ${pois.length} POIs (${pois.filter(p => p.acrossRiver).length} across the river) ===`);
	for (const category of CATEGORIES) console.log(`  ${category.padEnd(8)} ${counts[category] ?? 0}`);

	console.log("\n=== per trailhead ===");
	for (const wp of waypoints) {
		const near = countBy(pois.filter(p => p.nearestTrailhead === wp.name), p => p.category);
		console.log(`  ${wp.name.padEnd(18)} ${CATEGORIES.map(c => `${c} ${String(near[c] ?? 0).padStart(3)}`).join("   ")}`);
	}

	console.log(`\n=== services grid coverage (POI within ${CORRIDOR_MILES} mi of the trailhead) ===`);
	const misses: string[] = [];
	for (const [service, matches] of Object.entries(SERVICE_MATCHERS)) {
		let expected = 0;
		let found = 0;
		for (const wp of waypoints) {
			if (!wp.services?.[service as keyof TrailheadServices]) continue;
			expected++;
			if (pois.some(p => matches(p) && haversineMiles(p, wp) <= CORRIDOR_MILES)) found++;
			else misses.push(`${wp.name}: ${service}`);
		}
		console.log(`  ${service.padEnd(12)} ${found}/${expected}`);
	}
	if (misses.length) console.log(`  missing -> ${misses.join("; ")}`);

}

// Contact detail edits are only counted; the full detail is in the diff of the two files
function describeChanges(before: Poi, after: Poi) {
	const changes: string[] = [];
	if (before.name !== after.name) changes.push(`renamed from "${before.name}"`);
	if (before.category !== after.category || before.subcategory !== after.subcategory) {
		changes.push(`${before.category}/${before.subcategory} -> ${after.category}/${after.subcategory}`);
	}
	const moved = haversineMiles(before, after);
	if (moved >= MOVED_MILES) changes.push(`moved ${moved.toFixed(2)} mi`);
	if (before.acrossRiver !== after.acrossRiver) changes.push(after.acrossRiver ? "now across the river" : "no longer across the river");
	return changes;
}

function reportChanges(pois: Poi[], published: PoiFile, warnings: string[]) {
	const before = new Map(published.pois.map(p => [p.id, p]));
	const after = new Map(pois.map(p => [p.id, p]));
	const added = pois.filter(p => !before.has(p.id));
	const removed = published.pois.filter(p => !after.has(p.id));
	const kept = pois.filter(p => before.has(p.id));
	const changed = kept
		.map(poi => ({ poi, changes: describeChanges(before.get(poi.id)!, poi) }))
		.filter(entry => entry.changes.length > 0);
	const contactEdits = CONTACT_FIELDS
		.map(field => `${field} ${kept.filter(p => before.get(p.id)![field] !== p[field]).length}`)
		.join(", ");

	console.log(`\n=== changes vs published (Overture ${published.overtureRelease}, generated ${published.generatedAt.slice(0, 10)}) -> Overture ${release} ===`);
	const row = (label: string, cells: (string | number)[]) => console.log(`  ${label.padEnd(8)}${cells.map(c => String(c).padStart(10)).join("")}`);
	row("", ["published", "new", "added", "removed", "changed"]);
	for (const category of [...CATEGORIES, null]) {
		const inCategory = (p: Poi) => category === null || p.category === category;
		row(category ?? "total", [
			published.pois.filter(inCategory).length,
			pois.filter(inCategory).length,
			`+${added.filter(inCategory).length}`,
			`-${removed.filter(inCategory).length}`,
			changed.filter(entry => inCategory(entry.poi)).length,
		]);
	}

	for (const warning of warnings) console.log(`  !! WARNING: ${warning}`);

	const label = (poi: Poi) => `[${poi.category}] ${poi.name} (${poi.nearestTrailhead})`;
	if (added.length + removed.length + changed.length > 0) console.log("");
	for (const poi of added) console.log(`  + ${label(poi)}`);
	for (const poi of removed) console.log(`  - ${label(poi)}`);
	for (const { poi, changes } of changed) console.log(`  ~ ${label(poi)}: ${changes.join("; ")}`);
	console.log(`\n  contact detail edits: ${contactEdits}`);
}

function checkDrops(pois: Poi[], previous: Poi[]) {
	const problems: string[] = [];
	const dropOf = (before: number, after: number) => (before === 0 ? 0 : (before - after) / before);
	if (dropOf(previous.length, pois.length) > MAX_TOTAL_DROP) {
		problems.push(`total fell from ${previous.length} to ${pois.length}`);
	}
	const before = countBy(previous, p => p.category);
	const after = countBy(pois, p => p.category);
	for (const category of CATEGORIES) {
		if (dropOf(before[category] ?? 0, after[category] ?? 0) > MAX_CATEGORY_DROP) {
			problems.push(`${category} fell from ${before[category]} to ${after[category] ?? 0}`);
		}
	}
	return problems;
}

// Saves the published file next to the new one so the two can be diffed
async function loadPublished() {
	mkdirSync(OUT_DIR, { recursive: true });
	rmSync(PUBLISHED_PATH, { force: true });
	if (!s3Configured) {
		console.log("POI_S3_BUCKET is not set: no published baseline to compare against, and nothing can be published");
		return null;
	}
	const body = await downloadPublished(S3_POIS_KEY);
	if (body === null) {
		console.log("nothing published yet: no baseline to compare against");
		return null;
	}
	writeFileSync(PUBLISHED_PATH, body);
	return JSON.parse(body) as PoiFile;
}

function writeOutputs(pois: Poi[], published: PoiFile | null) {
	const unchanged = published !== null
		&& published.overtureRelease === release
		&& JSON.stringify(published.pois) === JSON.stringify(pois);
	const file: PoiFile = {
		schemaVersion: SCHEMA_VERSION,
		generatedAt: unchanged ? published.generatedAt : new Date().toISOString(),
		overtureRelease: release,
		attribution: ATTRIBUTION,
		pois,
	};
	const body = JSON.stringify(file, null, 1) + "\n";
	const manifest = {
		schemaVersion: SCHEMA_VERSION,
		generatedAt: file.generatedAt,
		sha256: createHash("sha256").update(body).digest("hex"),
		count: pois.length,
		file: S3_POIS_KEY,
	};
	const geojson = {
		type: "FeatureCollection",
		features: pois.map(({ lat, lng, ...properties }) => ({
			type: "Feature",
			geometry: { type: "Point", coordinates: [lng, lat] },
			properties: { ...properties, "marker-color": MARKER_COLORS[properties.category] },
		})),
	};

	writeFileSync(POIS_PATH, body);
	writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 1) + "\n");
	writeFileSync(GEOJSON_PATH, JSON.stringify(geojson) + "\n");
	console.log(`\nwrote ${relative(process.cwd(), POIS_PATH)} (${(body.length / 1024).toFixed(0)} KB)`);
	return unchanged;
}

async function confirm(question: string) {
	const prompt = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await prompt.question(`${question} [y/N] `);
		return /^y(es)?$/i.test(answer.trim());
	} finally {
		prompt.close();
	}
}

const published = await loadPublished();
const pois = buildPois();
const warnings = published ? checkDrops(pois, published.pois) : [];
report(pois);
if (published) reportChanges(pois, published, warnings);

const unchanged = writeOutputs(pois, published);
if (published) console.log(`compare: vimdiff ${relative(process.cwd(), PUBLISHED_PATH)} ${relative(process.cwd(), POIS_PATH)}`);

if (!s3Configured) process.exit(0);
if (unchanged) {
	console.log("\nidentical to the published file: nothing to publish");
	process.exit(0);
}
if (!process.stdin.isTTY) {
	console.log("\nnot running in a terminal, so nothing was published");
	process.exit(0);
}

console.log("");
for (const warning of warnings) console.log(`!! WARNING: ${warning}`);
const question = warnings.length ? `The counts dropped sharply. Publish to ${s3Target} anyway?` : `Publish to ${s3Target}?`;
if (await confirm(question)) {
	// The manifest goes last so clients never see a hash for a file that isn't there yet
	await uploadJson(S3_POIS_KEY, readFileSync(POIS_PATH, "utf8"));
	await uploadJson(S3_MANIFEST_KEY, readFileSync(MANIFEST_PATH, "utf8"));
} else {
	console.log("not published");
}
