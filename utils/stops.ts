import type { Poi } from "@/constants/pois";
import { trailPoints } from "@/constants/trailPoints";
import type { StopLeg, TripStop } from "@/types/Trip";
import { getTrailMiles, trailIndexOf } from "@/utils/trail";

// Lets a place just past either end, such as lodging in the end town, still count as on the route
const ROUTE_TOLERANCE_MILES = 0.5;

/** A point along a leg: one of the leg's ends when `stop` is unset */
export interface RoutePoint {
	trailIndex: number;
	milesFromTrail: number;
	stop?: TripStop;
}

export interface ItineraryEntry extends RoutePoint {
	/** Shared by the trip screen and the stop picker; set for stops only */
	number?: number;
	/** Miles from the previous entry, 0 for the first */
	legMiles: number;
}

export interface TripItinerary {
	out: ItineraryEntry[];
	/** Null for one-way trips */
	back: ItineraryEntry[] | null;
	totalMiles: number;
	offTrailMiles: number;
}

export function toTripStop(poi: Poi, leg: StopLeg): TripStop {
	return {
		leg,
		poiId: poi.id,
		name: poi.name,
		category: poi.category,
		lat: poi.lat,
		lng: poi.lng,
		exit: { ...trailPoints[poi.trailIndex] },
		milesFromTrail: poi.milesFromTrail,
	};
}

export function isSameStop(a: TripStop, b: TripStop) {
	return a.leg === b.leg && a.poiId === b.poiId;
}

export function addStop(stops: TripStop[], stop: TripStop) {
	return stops.some(existing => isSameStop(existing, stop)) ? stops : [...stops, stop];
}

export function removeStop(stops: TripStop[], stop: TripStop) {
	return stops.filter(existing => !isSameStop(existing, stop));
}

export function getLegStops(stops: TripStop[], leg: StopLeg) {
	return stops.filter(stop => stop.leg === leg);
}

export function getStopTrailIndex(stop: TripStop) {
	return trailIndexOf(stop.exit);
}

export function isOnRoute(trailIndex: number, start: number, end: number) {
	const low = Math.min(start, end);
	const high = Math.max(start, end);
	return (trailIndex >= low && trailIndex <= high)
		|| getTrailMiles(trailIndex, low) <= ROUTE_TOLERANCE_MILES
		|| getTrailMiles(trailIndex, high) <= ROUTE_TOLERANCE_MILES;
}

export function isStopOnRoute(stop: TripStop, start: number, end: number) {
	return isOnRoute(getStopTrailIndex(stop), start, end);
}

function endpoint(trailIndex: number): RoutePoint {
	return { trailIndex, milesFromTrail: 0 };
}

export function getStopPoint(stop: TripStop): RoutePoint {
	return { trailIndex: getStopTrailIndex(stop), milesFromTrail: stop.milesFromTrail, stop };
}

/** Miles from one point to the next: back to the trail, along it, then out to the next point */
export function getLegMiles(from: RoutePoint, to: RoutePoint) {
	return from.milesFromTrail + getTrailMiles(from.trailIndex, to.trailIndex) + to.milesFromTrail;
}

function compareAlongLeg(from: number, to: number) {
	const direction = Math.sign(to - from);
	return (a: RoutePoint, b: RoutePoint) =>
		(a.trailIndex - b.trailIndex) * direction || a.milesFromTrail - b.milesFromTrail;
}

/** The leg's stops in the order they're reached going from `from` to `to` */
export function sortLegStops(legStops: TripStop[], from: number, to: number): RoutePoint[] {
	return legStops.map(getStopPoint).sort(compareAlongLeg(from, to));
}

function buildLegItinerary(from: number, to: number, legStops: TripStop[], firstNumber: number): ItineraryEntry[] {
	const points = [endpoint(from), ...sortLegStops(legStops, from, to), endpoint(to)];
	let number = firstNumber;
	return points.map((point, index) => ({
		...point,
		number: point.stop ? number++ : undefined,
		legMiles: index === 0 ? 0 : getLegMiles(points[index - 1], point),
	}));
}

/** Expects stops already limited to the route, and to the way out for a one-way trip */
export function buildTripItinerary(start: number, end: number, isRoundTrip: boolean, stops: TripStop[]): TripItinerary {
	const outStops = getLegStops(stops, 'out');
	const out = buildLegItinerary(start, end, outStops, 1);
	const back = isRoundTrip
		? buildLegItinerary(end, start, getLegStops(stops, 'back'), outStops.length + 1)
		: null;
	const entries = [...out, ...(back ?? [])];
	return {
		out,
		back,
		totalMiles: entries.reduce((sum, entry) => sum + entry.legMiles, 0),
		offTrailMiles: entries.reduce((sum, entry) => sum + (entry.stop ? entry.milesFromTrail * 2 : 0), 0),
	};
}

/** The point a new stop would follow on its leg: the leg's start, or the last stop reached before it */
export function findPreviousPoint(from: number, to: number, legStops: TripStop[], candidate: TripStop): RoutePoint {
	const candidatePoint = getStopPoint(candidate);
	const compare = compareAlongLeg(from, to);
	let previous = endpoint(from);
	for (const point of sortLegStops(legStops.filter(stop => !isSameStop(stop, candidate)), from, to)) {
		if (compare(point, candidatePoint) > 0) break;
		previous = point;
	}
	return previous;
}

function isCoordinate(value: unknown): value is { lat: number; lng: number } {
	const point = value as { lat?: unknown; lng?: unknown } | null;
	return typeof point === 'object' && point !== null && typeof point.lat === 'number' && typeof point.lng === 'number';
}

function isTripStop(value: unknown): value is TripStop {
	if (!isCoordinate(value)) return false;
	const stop = value as Partial<Record<keyof TripStop, unknown>>;
	return (stop.leg === 'out' || stop.leg === 'back')
		&& typeof stop.poiId === 'string'
		&& typeof stop.name === 'string'
		&& typeof stop.category === 'string'
		&& isCoordinate(stop.exit)
		&& typeof stop.milesFromTrail === 'number';
}

function parseJson(json: string | undefined): unknown {
	if (!json) return null;
	try {
		return JSON.parse(json);
	} catch {
		return null;
	}
}

export function parseStop(json?: string): TripStop | null {
	const value = parseJson(json);
	return isTripStop(value) ? value : null;
}

export function parseStops(json?: string): TripStop[] {
	const value = parseJson(json);
	return Array.isArray(value) ? value.filter(isTripStop) : [];
}
