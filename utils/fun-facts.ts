import { getTrailheadImage, hasTrailheadPhoto } from '@/constants/trailheadImages';
import { waypoints } from '@/constants/waypoints';
import type { FunFact, FunFactFile, FunFactLocation, FunFactManifest } from '@/types/FunFact';
import { fetchManifestFile, fetchOk } from '@/utils/remote-data';
import { saveCachedFunFacts } from '@/utils/storage';
import type { ImageSourcePropType } from 'react-native';

export const FACTS_BASE_URL = 'https://d1z2mt0madk0y1.cloudfront.net/facts';
export const FACTS_SCHEMA_VERSION = 1;
export const FACTS_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

function parseLocation(value: unknown): FunFactLocation | undefined {
	if (!isObject(value)) return undefined;
	if (typeof value.trailhead === 'string') {
		return waypoints.some(waypoint => waypoint.name === value.trailhead) ? { trailhead: value.trailhead } : undefined;
	}
	if (Number.isFinite(value.lat) && Number.isFinite(value.lng)) {
		return { lat: value.lat as number, lng: value.lng as number };
	}
	return undefined;
}

/**
 * The well-formed facts in a facts file, or none when it isn't a file this app version can read
 */
export function parseFunFacts(file: unknown): FunFact[] {
	if (!isObject(file) || file.schemaVersion !== FACTS_SCHEMA_VERSION || !Array.isArray(file.facts)) return [];
	return file.facts.flatMap((entry: unknown): FunFact[] => {
		if (!isObject(entry) || !isNonEmptyString(entry.id) || !isNonEmptyString(entry.text)) return [];
		const location = parseLocation(entry.location);
		return [{
			id: entry.id,
			text: entry.text,
			...(isNonEmptyString(entry.title) && { title: entry.title }),
			...(isNonEmptyString(entry.image) && { image: entry.image }),
			...(location && { location }),
		}];
	});
}

/**
 * Downloads and caches facts.json when the published manifest differs from the cached copy.
 * Null when there is nothing newer this app version can use.
 */
export async function fetchFunFactsIfChanged(cachedSha: string | undefined): Promise<FunFactFile | null> {
	const manifest: FunFactManifest = await (await fetchOk(`${FACTS_BASE_URL}/manifest.json`)).json();
	if (manifest.schemaVersion !== FACTS_SCHEMA_VERSION) {
		console.warn(`Skipping fun facts schema version ${manifest.schemaVersion}`);
		return null;
	}
	if (manifest.sha256 === cachedSha) return null;

	const { json, parsed } = await fetchManifestFile<FunFactFile>(FACTS_BASE_URL, manifest.file, manifest);
	await saveCachedFunFacts(json, manifest.sha256);
	return parsed;
}

// Changes once a day, the same for everyone on a given date
export function getFactOfTheDay(facts: FunFact[], now: Date) {
	if (facts.length === 0) return null;
	const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
	return facts[dayNumber % facts.length];
}

export function getFactTrailhead(fact: FunFact) {
	const location = fact.location;
	if (!location || !('trailhead' in location)) return undefined;
	return waypoints.find(waypoint => waypoint.name === location.trailhead);
}

export function getFactTitle(fact: FunFact) {
	return fact.title ?? getFactTrailhead(fact)?.name;
}

export function getFactImageUrl(fact: FunFact) {
	return fact.image ? `${FACTS_BASE_URL}/images/${encodeURIComponent(fact.image)}` : undefined;
}

export function getFactImage(fact: FunFact): ImageSourcePropType | undefined {
	const url = getFactImageUrl(fact);
	if (url) return { uri: url };
	const trailhead = getFactTrailhead(fact);
	return trailhead && hasTrailheadPhoto(trailhead) ? getTrailheadImage(trailhead) : undefined;
}
