import {
	OTHER_POI_CATEGORY,
	Poi,
	POI_BASE_URL,
	POI_CATEGORIES,
	POI_SCHEMA_VERSION,
	PoiCategory,
	PoiFile,
	PoiManifest,
	PoiRouteFile,
	SUBCATEGORY_LABELS,
} from '@/constants/pois';
import { waypoints } from '@/constants/waypoints';
import { Place } from '@/types/Place';
import { decodePolyline } from '@/utils/map';
import { saveCachedPoiRoutes, saveCachedPois } from '@/utils/storage';
import { getWaypointTrailMile, trailCoordinates } from '@/utils/trail';
import type { LatLng } from 'react-native-maps';

const MIN_QUERY_LENGTH = 2;
const MAX_SEARCH_RESULTS = 50;
const ON_TRAIL_MILES = 0.1;

async function fetchOk(url: string) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url} returned ${response.status}`);
	return response;
}

// CDN caches expire independently, so a fresh manifest can arrive alongside a stale file
async function fetchManifestFile<T extends { generatedAt: string }>(file: string, manifest: PoiManifest) {
	const json = await (await fetchOk(`${POI_BASE_URL}/${file}`)).text();
	const parsed: T = JSON.parse(json);
	if (parsed.generatedAt !== manifest.generatedAt) {
		throw new Error(`${file} does not match the manifest`);
	}
	return { json, parsed };
}

/**
 * Downloads and caches pois.json and routes.json when the published manifest differs from the cached copies.
 * Each result is null when there is nothing newer this app version can use.
 */
export async function fetchPoiDataIfChanged(
	cachedPoisSha: string | undefined,
	cachedRoutesSha: string | undefined,
): Promise<{ pois: PoiFile | null; routes: PoiRouteFile | null }> {
	const manifest: PoiManifest = await (await fetchOk(`${POI_BASE_URL}/manifest.json`)).json();
	if (manifest.schemaVersion !== POI_SCHEMA_VERSION) {
		console.warn(`Skipping POI schema version ${manifest.schemaVersion}`);
		return { pois: null, routes: null };
	}

	const pois = manifest.sha256 === cachedPoisSha
		? null
		: await fetchManifestFile<PoiFile>(manifest.file, manifest);
	const routes = !manifest.routes || manifest.routes.sha256 === cachedRoutesSha
		? null
		: await fetchManifestFile<PoiRouteFile>(manifest.routes.file, manifest);

	if (pois) await saveCachedPois(pois.json, manifest.sha256);
	if (routes && manifest.routes) await saveCachedPoiRoutes(routes.json, manifest.routes.sha256);
	return { pois: pois?.parsed ?? null, routes: routes?.parsed ?? null };
}

/**
 * A place's bike route, from its trail exit to the marker, or null when it has none
 */
export function getPoiRouteCoordinates(poi: Poi, routes: Record<string, string>): LatLng[] | null {
	const encoded = routes[poi.id];
	if (!encoded) return null;
	return [
		trailCoordinates[poi.trailIndex],
		...decodePolyline(encoded),
		{ latitude: poi.lat, longitude: poi.lng },
	];
}

export function getCategoryConfig(category: PoiCategory) {
	return POI_CATEGORIES.find(config => config.key === category) ?? OTHER_POI_CATEGORY;
}

export function areAllCategoriesEnabled(enabledCategories: ReadonlySet<PoiCategory>) {
	return POI_CATEGORIES.every(category => enabledCategories.has(category.key));
}

export function getSubcategoryLabel(poi: Poi) {
	return SUBCATEGORY_LABELS[poi.category]?.[poi.subcategory] ?? getCategoryConfig(poi.category).label;
}

export function getPlaceTrailMile(place: Place) {
	return place.kind === 'poi' ? place.poi.trailMile : getWaypointTrailMile(place.waypoint);
}

export function compareByTrailMile(a: Place, b: Place) {
	return getPlaceTrailMile(a) - getPlaceTrailMile(b);
}

export function isOnTrail(miles: number) {
	return miles < ON_TRAIL_MILES;
}

export function formatMilesFromTrail(miles: number) {
	return isOnTrail(miles) ? 'on the trail' : `${miles.toFixed(1)} mi off trail`;
}

function normalize(text: string) {
	return text.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
}

function poiSearchText(poi: Poi) {
	return normalize([
		poi.name,
		getCategoryConfig(poi.category).label,
		getSubcategoryLabel(poi),
		poi.subcategory.replace(/_/g, ' '),
		poi.nearestTrailhead,
		poi.address ?? '',
	].join(' '));
}

const searchIndexCache = new WeakMap<Poi[], { poi: Poi; name: string; details: string }[]>();

function getSearchIndex(pois: Poi[]) {
	let index = searchIndexCache.get(pois);
	if (!index) {
		index = pois.map(poi => ({ poi, name: normalize(poi.name), details: poiSearchText(poi) }));
		searchIndexCache.set(pois, index);
	}
	return index;
}

// 0: name is the query, 1: name starts with it, 2: name contains it, 3: every word appears somewhere in the details
function matchRank(query: string, words: string[], name: string, details: string) {
	if (name === query) return 0;
	if (name.startsWith(query) || name.includes(` ${query}`)) return 1;
	if (name.includes(query)) return 2;
	if (words.every(word => details.includes(word))) return 3;
	return null;
}

/**
 * Searches every trailhead and POI, regardless of the map viewport or category filter
 */
export function searchPlaces(query: string, pois: Poi[]): Place[] {
	const normalizedQuery = normalize(query);
	if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];
	const words = normalizedQuery.split(' ');

	const matches: { place: Place; rank: number }[] = [];
	for (const waypoint of waypoints) {
		const name = normalize(waypoint.name);
		const rank = matchRank(normalizedQuery, words, name, `${name} trailhead`);
		if (rank !== null) matches.push({ place: { kind: 'trailhead', waypoint }, rank });
	}
	for (const { poi, name, details } of getSearchIndex(pois)) {
		const rank = matchRank(normalizedQuery, words, name, details);
		if (rank !== null) matches.push({ place: { kind: 'poi', poi }, rank });
	}

	return matches
		.sort((a, b) => a.rank - b.rank || compareByTrailMile(a.place, b.place))
		.slice(0, MAX_SEARCH_RESULTS)
		.map(match => match.place);
}

export function isSearchQuery(query: string) {
	return normalize(query).length >= MIN_QUERY_LENGTH;
}
