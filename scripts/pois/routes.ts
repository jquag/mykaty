import {
	ROUTE_MAX_SNAP_MILES,
	ROUTE_REQUEST_INTERVAL_MS,
	ROUTE_SAMPLE_MILES,
	ROUTE_TABLE_MAX_COORDS,
} from "./config.ts";
import { haversineMiles } from "./geo.ts";
import type { LatLng } from "./geo.ts";

export interface RouteTarget extends LatLng {
	trailIndex: number;
}

export interface Route {
	trailIndex: number;
	miles: number;
}

const osrmUrl = (process.env.OSRM_URL ?? "https://routing.openstreetmap.de/routed-bike").replace(/\/+$/, "");
const USER_AGENT = "mykaty-poi-build/1.0 (john@quagworks.com)";
const METERS_PER_MILE = 1609.344;
const MAX_ATTEMPTS = 4;

export const routingServer = osrmUrl;

// Trail points spaced about ROUTE_SAMPLE_MILES apart, used as the places a rider can leave the trail
function sampleTrail(trailMiles: number[]) {
	const samples = [0];
	for (let i = 1; i < trailMiles.length; i++) {
		if (trailMiles[i] - trailMiles[samples.at(-1)!] >= ROUTE_SAMPLE_MILES) samples.push(i);
	}
	if (samples.at(-1) !== trailMiles.length - 1) samples.push(trailMiles.length - 1);
	return samples;
}

// A route is never shorter than the straight line, so trail points beyond the target's limit can't give a keepable route
function candidatesFor(target: RouteTarget, maxMiles: number, trail: LatLng[], samples: number[]) {
	const near = samples.filter(i => haversineMiles(target, trail[i]) <= maxMiles);
	return [...new Set([target.trailIndex, ...near])];
}

// Groups targets that sit along the same stretch of trail so they share exit points in one table request
function batch<T extends RouteTarget>(targets: T[], maxMiles: (target: T) => number, trail: LatLng[], samples: number[]) {
	const sorted = [...targets].sort((a, b) => a.trailIndex - b.trailIndex);
	const batches: { sources: Set<number>; targets: T[] }[] = [];
	let current = { sources: new Set<number>(), targets: [] as T[] };
	for (const target of sorted) {
		const candidates = candidatesFor(target, maxMiles(target), trail, samples);
		const sources = new Set([...current.sources, ...candidates]);
		if (current.targets.length && sources.size + current.targets.length + 1 > ROUTE_TABLE_MAX_COORDS) {
			batches.push(current);
			current = { sources: new Set(candidates), targets: [target] };
		} else {
			current = { sources, targets: [...current.targets, target] };
		}
	}
	if (current.targets.length) batches.push(current);
	return batches;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastRequestAt = 0;

interface Table {
	distances: (number | null)[][];
	sources: { distance: number }[];
	destinations: { distance: number }[];
}

class PermanentError extends Error {}

const coordinatePath = (coordinates: LatLng[]) => coordinates.map(c => `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`).join(";");

// Spaces requests to the server's rate limit and retries server errors; client errors fail at once as PermanentError
async function osrmGet<T>(url: string): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		await sleep(Math.max(0, lastRequestAt + ROUTE_REQUEST_INTERVAL_MS - Date.now()));
		lastRequestAt = Date.now();
		try {
			const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(60_000) });
			const body = await response.json().catch(() => null);
			if (response.ok && body?.code === "Ok") return body;
			const message = `${osrmUrl} returned ${response.status} ${body?.code ?? ""} ${body?.message ?? ""}`.trim();
			throw response.status < 500 && response.status !== 429 ? new PermanentError(message) : new Error(message);
		} catch (error) {
			if (error instanceof PermanentError || attempt === MAX_ATTEMPTS) throw error;
			console.warn(`routing request failed (${(error as Error).message}); retrying`);
			await sleep(ROUTE_REQUEST_INTERVAL_MS * 5 * attempt);
		}
	}
}

function fetchTable(coordinates: LatLng[], sourceCount: number) {
	const indices = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i).join(";");
	return osrmGet<Table>(
		`${osrmUrl}/table/v1/bike/${coordinatePath(coordinates)}` +
		`?sources=${indices(0, sourceCount)}&destinations=${indices(sourceCount, coordinates.length)}&annotations=distance`,
	);
}

/**
 * Returns the bike route from one point to another as a Google encoded polyline (precision 5),
 * or null when the server rejects the request (for example, no route).
 */
export async function fetchRouteLine(from: LatLng, to: LatLng) {
	try {
		const body = await osrmGet<{ routes: { geometry: string }[] }>(
			`${osrmUrl}/route/v1/bike/${coordinatePath([from, to])}?overview=full&geometries=polyline`,
		);
		return body.routes[0]?.geometry ?? null;
	} catch (error) {
		if (error instanceof PermanentError) return null;
		throw error;
	}
}

/**
 * Finds the shortest bike route from any trail point within maxMiles of each target, including the walk from the road it snaps to.
 * Targets with no trustworthy route are absent from the result: OSRM found no route, or the nearest
 * bikeable way is more than ROUTE_MAX_SNAP_MILES away (usually a place on a highway bikes can't use).
 */
export async function routeFromTrail<T extends RouteTarget>(
	targets: T[],
	maxMiles: (target: T) => number,
	trail: LatLng[],
	trailMiles: number[],
) {
	const samples = sampleTrail(trailMiles);
	const batches = batch(targets, maxMiles, trail, samples);
	const routes = new Map<T, Route>();

	for (const [n, { sources, targets: batchTargets }] of batches.entries()) {
		process.stdout.write(`\rrouting ${n + 1}/${batches.length}`);
		const sourceIndices = [...sources];
		const table = await fetchTable([...sourceIndices.map(i => trail[i]), ...batchTargets], sourceIndices.length);
		for (const [d, target] of batchTargets.entries()) {
			const snapMiles = table.destinations[d].distance / METERS_PER_MILE;
			if (snapMiles > ROUTE_MAX_SNAP_MILES) continue;
			let best: Route | null = null;
			for (const [s, trailIndex] of sourceIndices.entries()) {
				const meters = table.distances[s][d];
				if (meters === null || table.sources[s].distance / METERS_PER_MILE > ROUTE_MAX_SNAP_MILES) continue;
				const miles = meters / METERS_PER_MILE + snapMiles;
				if (!best || miles < best.miles) best = { trailIndex, miles };
			}
			if (best) routes.set(target, best);
		}
	}
	process.stdout.write("\n");
	return routes;
}
