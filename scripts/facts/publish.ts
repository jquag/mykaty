import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { createInterface } from "node:readline/promises";
import { trailPoints } from "../../constants/trailPoints.ts";
import { waypoints } from "../../constants/waypoints.ts";
import { haversineMiles } from "../pois/geo.ts";
import { downloadPublished, s3Configured, s3Target, upload } from "./s3.ts";

const SCHEMA_VERSION = 1;
const MAX_MILES_FROM_TRAIL = 0.5;
const MAX_IMAGE_KB = 500;
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FACT_KEYS = ["id", "title", "text", "image", "location"];
const IMAGE_TYPES: Record<string, string> = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
};

const FACTS_KEY = "facts.json";
const MANIFEST_KEY = "manifest.json";
const IMAGES_FOLDER = "images";
const DATA_CACHE_CONTROL = "public, max-age=3600";
// Image names never change content once published, so CDNs and the app can keep them forever
const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

type FactLocation = { trailhead: string } | { lat: number; lng: number };

interface Fact {
	id: string;
	title?: string;
	text: string;
	image?: string;
	location?: FactLocation;
}

interface FactFile {
	schemaVersion: number;
	generatedAt: string;
	facts: Fact[];
}

interface Manifest {
	schemaVersion: number;
	generatedAt: string;
	sha256: string;
	count: number;
	file: string;
	// Every image ever published, so a reused name with new content is caught even after a fact stops using it
	images: Record<string, string>;
}

const DIR = import.meta.dirname;
const SOURCE_PATH = join(DIR, "facts.json");
const IMAGES_DIR = join(DIR, IMAGES_FOLDER);
const OUT_DIR = join(DIR, "out");
const FACTS_PATH = join(OUT_DIR, FACTS_KEY);
const MANIFEST_PATH = join(OUT_DIR, MANIFEST_KEY);
const PUBLISHED_PATH = join(OUT_DIR, "facts.published.json");

const trailheadNames = new Set(waypoints.map(waypoint => waypoint.name));
const errors: string[] = [];
const warnings: string[] = [];

function sha256(data: string | Buffer) {
	return createHash("sha256").update(data).digest("hex");
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function milesFromTrail(lat: number, lng: number) {
	let closest = Infinity;
	for (const point of trailPoints) {
		closest = Math.min(closest, haversineMiles({ lat, lng }, point));
	}
	return closest;
}

function validateLocation(label: string, location: unknown): FactLocation | undefined {
	if (!isObject(location)) {
		errors.push(`${label}: location must be { "trailhead": … } or { "lat": …, "lng": … }`);
		return undefined;
	}
	const keys = Object.keys(location).sort().join(",");
	if (keys === "trailhead") {
		if (typeof location.trailhead !== "string" || !trailheadNames.has(location.trailhead)) {
			errors.push(`${label}: no trailhead named ${JSON.stringify(location.trailhead)} in constants/waypoints.ts`);
			return undefined;
		}
		return { trailhead: location.trailhead };
	}
	if (keys === "lat,lng") {
		const { lat, lng } = location;
		if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
			errors.push(`${label}: lat and lng must be numbers`);
			return undefined;
		}
		const miles = milesFromTrail(lat, lng);
		if (miles > MAX_MILES_FROM_TRAIL) {
			errors.push(`${label}: ${lat}, ${lng} is ${miles.toFixed(2)} mi from the trail (limit ${MAX_MILES_FROM_TRAIL} mi)`);
			return undefined;
		}
		return { lat, lng };
	}
	errors.push(`${label}: location must have either "trailhead" or both "lat" and "lng"`);
	return undefined;
}

function validateImage(label: string, image: unknown) {
	if (typeof image !== "string" || image.includes("/") || !(extname(image).toLowerCase() in IMAGE_TYPES)) {
		errors.push(`${label}: image must be a file name in ${IMAGES_FOLDER}/ ending in ${Object.keys(IMAGE_TYPES).join(", ")}`);
		return undefined;
	}
	const path = join(IMAGES_DIR, image);
	if (!existsSync(path)) {
		errors.push(`${label}: ${relative(process.cwd(), path)} does not exist`);
		return undefined;
	}
	const kb = statSync(path).size / 1024;
	if (kb > MAX_IMAGE_KB) warnings.push(`${image} is ${Math.ceil(kb)} KB; aim for under ${MAX_IMAGE_KB} KB`);
	return image;
}

// Rewrites each fact with its keys in a fixed order, so the published file diffs cleanly
function validateFacts(source: unknown): Fact[] {
	if (!isObject(source) || source.schemaVersion !== SCHEMA_VERSION || !Array.isArray(source.facts)) {
		errors.push(`facts.json must be { "schemaVersion": ${SCHEMA_VERSION}, "facts": [ … ] }`);
		return [];
	}

	const ids = new Set<string>();
	const facts: Fact[] = [];
	source.facts.forEach((entry: unknown, index: number) => {
		if (!isObject(entry)) {
			errors.push(`fact ${index + 1}: must be an object`);
			return;
		}
		const label = typeof entry.id === "string" ? entry.id : `fact ${index + 1}`;
		const unknownKeys = Object.keys(entry).filter(key => !FACT_KEYS.includes(key));
		if (unknownKeys.length) errors.push(`${label}: unknown ${unknownKeys.length === 1 ? "key" : "keys"} ${unknownKeys.join(", ")}`);

		if (typeof entry.id !== "string" || !ID_PATTERN.test(entry.id)) {
			errors.push(`${label}: id must be lowercase words joined by hyphens`);
		} else if (ids.has(entry.id)) {
			errors.push(`${label}: duplicate id`);
		}
		if (typeof entry.id === "string") ids.add(entry.id);
		if (!isNonEmptyString(entry.text)) errors.push(`${label}: text is missing`);
		if (entry.title !== undefined && !isNonEmptyString(entry.title)) errors.push(`${label}: title must be text`);

		const image = entry.image === undefined ? undefined : validateImage(label, entry.image);
		const location = entry.location === undefined ? undefined : validateLocation(label, entry.location);
		facts.push({
			id: String(entry.id),
			...(entry.title !== undefined && { title: String(entry.title).trim() }),
			text: String(entry.text).trim(),
			...(image !== undefined && { image }),
			...(location !== undefined && { location }),
		});
	});

	const referenced = new Set(facts.flatMap(fact => (fact.image ? [fact.image] : [])));
	const unused = existsSync(IMAGES_DIR)
		? readdirSync(IMAGES_DIR).filter(file => !file.startsWith(".") && !referenced.has(file))
		: [];
	for (const file of unused) warnings.push(`${IMAGES_FOLDER}/${file} isn't used by any fact`);

	return facts;
}

// Saves the published file next to the new one so the two can be diffed
async function loadPublished() {
	mkdirSync(OUT_DIR, { recursive: true });
	rmSync(PUBLISHED_PATH, { force: true });
	if (!s3Configured) {
		console.log("FACTS_S3_BUCKET is not set: no published baseline to compare against, and nothing can be published");
		return null;
	}
	const [manifestBody, factsBody] = await Promise.all([downloadPublished(MANIFEST_KEY), downloadPublished(FACTS_KEY)]);
	if (manifestBody === null || factsBody === null) {
		console.log("nothing published yet: no baseline to compare against");
		return null;
	}
	writeFileSync(PUBLISHED_PATH, factsBody);
	return { manifest: JSON.parse(manifestBody) as Manifest, file: JSON.parse(factsBody) as FactFile };
}

function reportChanges(facts: Fact[], published: FactFile) {
	const before = new Map(published.facts.map(fact => [fact.id, fact]));
	const after = new Set(facts.map(fact => fact.id));
	const added = facts.filter(fact => !before.has(fact.id));
	const removed = published.facts.filter(fact => !after.has(fact.id));
	const changed = facts.filter(fact => before.has(fact.id) && JSON.stringify(before.get(fact.id)) !== JSON.stringify(fact));

	console.log(`\n=== changes vs published (generated ${published.generatedAt.slice(0, 10)}) ===`);
	console.log(`${published.facts.length} -> ${facts.length} facts: ${added.length} added, ${removed.length} removed, ${changed.length} changed`);
	for (const fact of added) console.log(`  + ${fact.id}: ${fact.text}`);
	for (const fact of removed) console.log(`  - ${fact.id}: ${fact.text}`);
	for (const fact of changed) console.log(`  ~ ${fact.id}`);
}

function imageHashes(facts: Fact[]) {
	const hashes: Record<string, string> = {};
	for (const fact of facts) {
		if (fact.image) hashes[fact.image] = sha256(readFileSync(join(IMAGES_DIR, fact.image)));
	}
	return hashes;
}

function writeOutputs(
	facts: Fact[],
	images: Record<string, string>,
	publishedImages: Record<string, string>,
	newImages: string[],
	published: Awaited<ReturnType<typeof loadPublished>>,
) {
	const allImages = { ...publishedImages, ...images };
	// A manifest older than facts.json means the last publish stopped before uploading it
	const unchanged = published !== null
		&& published.manifest.generatedAt === published.file.generatedAt
		&& newImages.length === 0
		&& JSON.stringify(published.file.facts) === JSON.stringify(facts);
	const generatedAt = unchanged ? published.file.generatedAt : new Date().toISOString();
	const file: FactFile = { schemaVersion: SCHEMA_VERSION, generatedAt, facts };
	const body = JSON.stringify(file, null, 1) + "\n";
	const manifest: Manifest = {
		schemaVersion: SCHEMA_VERSION,
		generatedAt,
		sha256: sha256(body),
		count: facts.length,
		file: FACTS_KEY,
		images: Object.fromEntries(Object.entries(allImages).sort(([a], [b]) => a.localeCompare(b))),
	};
	writeFileSync(FACTS_PATH, body);
	writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 1) + "\n");
	console.log(`\nwrote ${relative(process.cwd(), FACTS_PATH)} and ${relative(process.cwd(), MANIFEST_PATH)}`);
	return unchanged;
}

async function confirm(question: string) {
	const prompt = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await prompt.question(`${question} [y/N] `);
		return /^y(es)?$/i.test(answer.trim());
	} catch (error) {
		// Ctrl+C or Ctrl+D at the prompt
		if ((error as { code?: string }).code === "ABORT_ERR") return false;
		throw error;
	} finally {
		prompt.close();
	}
}

const facts = validateFacts(JSON.parse(readFileSync(SOURCE_PATH, "utf8")));
const images = errors.length ? {} : imageHashes(facts);
const published = errors.length ? null : await loadPublished();
const publishedImages = published?.manifest.images ?? {};
const newImages = Object.keys(images).filter(name => !(name in publishedImages));

for (const [name, hash] of Object.entries(images)) {
	const publishedHash = publishedImages[name];
	if (publishedHash && publishedHash !== hash) {
		errors.push(`${IMAGES_FOLDER}/${name} differs from the published image of that name; save the new photo under a new name`);
	}
}

for (const warning of warnings) console.log(`warning: ${warning}`);
if (errors.length) {
	for (const error of errors) console.log(`error: ${error}`);
	console.log(`\n${errors.length} ${errors.length === 1 ? "error" : "errors"}: nothing was written or published`);
	process.exit(1);
}

const atTrailheads = facts.filter(fact => fact.location && "trailhead" in fact.location).length;
const atSpots = facts.filter(fact => fact.location && "lat" in fact.location).length;
console.log(`${facts.length} facts: ${atTrailheads} at trailheads, ${atSpots} at other spots, ${facts.length - atTrailheads - atSpots} without a location; ${Object.keys(images).length} images`);

if (published) reportChanges(facts, published.file);
const unchanged = writeOutputs(facts, images, publishedImages, newImages, published);
if (published) console.log(`compare: vimdiff ${relative(process.cwd(), PUBLISHED_PATH)} ${relative(process.cwd(), FACTS_PATH)}`);

if (!s3Configured) process.exit(0);
if (unchanged) {
	console.log("\nidentical to the published facts: nothing to publish");
	process.exit(0);
}
if (!process.stdin.isTTY) {
	console.log("\nnot running in a terminal, so nothing was published");
	process.exit(0);
}

console.log("");
if (await confirm(`Publish to ${s3Target}${newImages.length ? ` with ${newImages.length} new ${newImages.length === 1 ? "image" : "images"}` : ""}?`)) {
	for (const name of newImages) {
		const type = IMAGE_TYPES[extname(name).toLowerCase()];
		await upload(`${IMAGES_FOLDER}/${name}`, readFileSync(join(IMAGES_DIR, name)), type, IMAGE_CACHE_CONTROL);
	}
	// The manifest goes last so clients never see a hash for a file that isn't there yet
	await upload(FACTS_KEY, readFileSync(FACTS_PATH, "utf8"), "application/json", DATA_CACHE_CONTROL);
	await upload(MANIFEST_KEY, readFileSync(MANIFEST_PATH, "utf8"), "application/json", DATA_CACHE_CONTROL);
} else {
	console.log("not published");
}
