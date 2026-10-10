import { trailPoints } from "@/constants/trailPoints";
import type { Trip, TripType } from "@/types/Trip";
import { AT_WAYPOINT_MILES, getTotalTrailMiles, getTrailMiles, getWaypointIndices } from "@/utils/trail";
import { getRouteMiles, getRouteName, getTripIndices } from "@/utils/trip-util";

export type TripFilter = TripType | 'all';

/** A stretch of trail as trail indices, start <= end (east to west) */
export interface TrailInterval {
	start: number;
	end: number;
}

export interface TripSuggestion {
	start: number;
	end: number;
	miles: number;
	routeName: string;
	kind: 'gap' | 'east' | 'west';
}

const TERMINUS_SNAP_MILES = 0.5;
const MIN_GAP_MILES = 0.25;
const MAX_SUGGESTION_MILES = 15;

const LAST_INDEX = trailPoints.length - 1;

// The trail data runs a little past the Clinton trailhead, so ends near either terminus count as reaching it
export function tripInterval(trip: Trip): TrailInterval {
	const { start, end } = getTripIndices(trip);
	let low = Math.min(start, end);
	let high = Math.max(start, end);
	if (getTrailMiles(0, low) <= TERMINUS_SNAP_MILES) low = 0;
	if (getTrailMiles(high, LAST_INDEX) <= TERMINUS_SNAP_MILES) high = LAST_INDEX;
	return { start: low, end: high };
}

export function mergeIntervals(intervals: TrailInterval[]) {
	const sorted = [...intervals].sort((a, b) => a.start - b.start);
	const merged: TrailInterval[] = [];
	for (const interval of sorted) {
		const last = merged[merged.length - 1];
		if (last && interval.start <= last.end) {
			last.end = Math.max(last.end, interval.end);
		} else {
			merged.push({ ...interval });
		}
	}
	return merged;
}

export function intervalsMiles(intervals: TrailInterval[]) {
	return intervals.reduce((sum, interval) => sum + getTrailMiles(interval.start, interval.end), 0);
}

function isNearIntervals(index: number, intervals: TrailInterval[]) {
	return intervals.some(interval =>
		(index >= interval.start && index <= interval.end)
		|| getTrailMiles(index, interval.start) <= AT_WAYPOINT_MILES
		|| getTrailMiles(index, interval.end) <= AT_WAYPOINT_MILES
	);
}

/** One flag per waypoint, in waypoint order */
export function findReachedTrailheads(covered: TrailInterval[]) {
	return getWaypointIndices().map(index => isNearIntervals(index, covered));
}

export function addedMiles(trip: Trip, covered: TrailInterval[]) {
	return intervalsMiles(mergeIntervals([...covered, tripInterval(trip)])) - intervalsMiles(covered);
}

// Starts at the trailhead on the covered side of `edge` and heads toward `farEdge`, one trailhead at a time,
// until the gap is closed or the next trailhead would make the trip too long
function suggestFrom(edge: number, farEdge: number, kind: TripSuggestion['kind']): TripSuggestion {
	const direction = Math.sign(farEdge - edge);
	const ahead = (index: number, of: number) => (index - of) * direction > 0;
	const waypointIndices = direction > 0 ? getWaypointIndices() : [...getWaypointIndices()].reverse();

	let start = edge;
	for (const index of waypointIndices) {
		if (ahead(index, edge) && getTrailMiles(index, edge) > AT_WAYPOINT_MILES) break;
		start = index;
	}

	let end = farEdge;
	const next = waypointIndices.filter(index => ahead(index, start) && getTrailMiles(index, start) > AT_WAYPOINT_MILES);
	if (next.length > 0) {
		end = next[0];
		for (const index of next.slice(1)) {
			if (!ahead(farEdge, end) || getTrailMiles(start, index) > MAX_SUGGESTION_MILES) break;
			end = index;
		}
	}

	return {
		start,
		end,
		miles: getTrailMiles(start, end),
		routeName: getRouteName(start, end),
		kind,
	};
}

/**
 * Suggests a trip that fills the shortest gap between known stretches, or else extends them toward
 * whichever end of the trail is closer. Planned trips count as known so they aren't suggested again.
 */
export function suggestTrip(known: TrailInterval[]): TripSuggestion | null {
	if (known.length === 0) return null;

	let shortestGap: { from: number; to: number; miles: number } | null = null;
	for (let i = 1; i < known.length; i++) {
		const from = known[i - 1].end;
		const to = known[i].start;
		const miles = getTrailMiles(from, to);
		if (miles >= MIN_GAP_MILES && (!shortestGap || miles < shortestGap.miles)) {
			shortestGap = { from, to, miles };
		}
	}
	if (shortestGap) return suggestFrom(shortestGap.from, shortestGap.to, 'gap');

	const first = known[0];
	const last = known[known.length - 1];
	const options: TripSuggestion[] = [];
	if (getTrailMiles(0, first.start) >= MIN_GAP_MILES) options.push(suggestFrom(first.start, 0, 'east'));
	if (getTrailMiles(last.end, LAST_INDEX) >= MIN_GAP_MILES) options.push(suggestFrom(last.end, LAST_INDEX, 'west'));
	if (options.length === 0) return null;
	return options.reduce((best, option) => (option.miles < best.miles ? option : best));
}

export function summarizeProgress(completed: Trip[], upcoming: Trip[], filter: TripFilter) {
	const matches = (trip: Trip) => filter === 'all' || trip.type === filter;
	const done = completed.filter(matches);
	const planned = upcoming.filter(matches);

	const covered = mergeIntervals(done.map(tripInterval));
	const plannedIntervals = mergeIntervals(planned.map(tripInterval));
	const coveredMiles = intervalsMiles(covered);
	const totalMiles = getTotalTrailMiles();
	const reached = findReachedTrailheads(covered);
	const longestMiles = done.reduce((longest, trip) => {
		const { start, end } = getTripIndices(trip);
		return Math.max(longest, getRouteMiles(start, end, trip.isRoundTrip));
	}, 0);

	return {
		tripCount: done.length,
		covered,
		planned: plannedIntervals,
		coveredMiles,
		totalMiles,
		fraction: coveredMiles / totalMiles,
		reached,
		reachedCount: reached.filter(Boolean).length,
		longestMiles,
		suggestion: suggestTrip(mergeIntervals([...covered, ...plannedIntervals])),
	};
}

export function formatPercent(fraction: number) {
	if (fraction > 0 && fraction < 0.01) return '<1%';
	return `${Math.floor(fraction * 100)}%`;
}
