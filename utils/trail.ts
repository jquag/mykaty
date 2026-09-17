import { trailPoints } from "@/constants/trailPoints";
import { waypoints } from "@/constants/waypoints";
import { haversineMiles } from "@/utils/map";

// Longitude degrees are shorter than latitude degrees by cos(latitude), about 0.78 along the trail
const LNG_SCALE = 0.78;
const AT_WAYPOINT_MILES = 0.1;
const WAYPOINT_SNAP_DEGREES = 0.001;
const LABELS_MAX_LNG_DELTA = 0.9;

export const trailCoordinates = trailPoints.map(point => ({
	latitude: point.lat,
	longitude: point.lng,
}));

export const TRAIL_REGION = computeTrailRegion();

// Zoom thresholds use longitudeDelta: unlike latitudeDelta, it stays constant while panning a Mercator map
const MARKERS_MAX_LNG_DELTA = TRAIL_REGION.longitudeDelta * 0.5;

const cumulativeMiles = computeCumulativeMiles();

let waypointIndices: number[] | null = null;

function computeTrailRegion() {
	const allLats = trailPoints.map(p => p.lat);
	const allLngs = trailPoints.map(p => p.lng);
	const minLat = Math.min(...allLats);
	const maxLat = Math.max(...allLats);
	const minLng = Math.min(...allLngs);
	const maxLng = Math.max(...allLngs);

	return {
		latitude: (minLat + maxLat) / 2,
		longitude: (minLng + maxLng) / 2,
		latitudeDelta: (maxLat - minLat) * 1.3,
		longitudeDelta: (maxLng - minLng) * 1.3,
	};
}

function computeCumulativeMiles() {
	const miles = new Array<number>(trailPoints.length);
	miles[0] = 0;
	for (let i = 1; i < trailPoints.length; i++) {
		miles[i] = miles[i - 1] + haversineMiles(trailPoints[i - 1], trailPoints[i]);
	}
	return miles;
}

function getWaypointIndices() {
	waypointIndices ??= waypoints.map(wp => nearestTrailIndex(wp.lat, wp.lng));
	return waypointIndices;
}

export function isTrailIndex(index: number) {
	return Number.isInteger(index) && index >= 0 && index < trailPoints.length;
}

export function getTrailMiles(startIndex: number, endIndex: number) {
	return Math.abs(cumulativeMiles[endIndex] - cumulativeMiles[startIndex]);
}

export function getSegmentCoordinates(startIndex: number, endIndex: number) {
	return trailCoordinates.slice(
		Math.min(startIndex, endIndex),
		Math.max(startIndex, endIndex) + 1
	);
}

export function nearestTrailIndex(lat: number, lng: number) {
	let closestIndex = 0;
	let closestDistance = Infinity;
	for (let i = 0; i < trailPoints.length; i++) {
		const latDiff = trailPoints[i].lat - lat;
		const lngDiff = (trailPoints[i].lng - lng) * LNG_SCALE;
		const dist = latDiff * latDiff + lngDiff * lngDiff;
		if (dist < closestDistance) {
			closestDistance = dist;
			closestIndex = i;
		}
	}
	return closestIndex;
}

// Snaps to a trailhead when the coordinate is within ~100 meters of one
export function findNearestTrailPoint(lat: number, lng: number): number {
	for (const waypoint of waypoints) {
		const latDiff = Math.abs(waypoint.lat - lat);
		const lngDiff = Math.abs(waypoint.lng - lng);
		if (latDiff < WAYPOINT_SNAP_DEGREES && lngDiff < WAYPOINT_SNAP_DEGREES) {
			return nearestTrailIndex(waypoint.lat, waypoint.lng);
		}
	}
	return nearestTrailIndex(lat, lng);
}

export function getNearestWaypoint(index: number) {
	const indices = getWaypointIndices();
	let nearest = 0;
	for (let i = 1; i < indices.length; i++) {
		if (getTrailMiles(index, indices[i]) < getTrailMiles(index, indices[nearest])) {
			nearest = i;
		}
	}
	return { waypoint: waypoints[nearest], miles: getTrailMiles(index, indices[nearest]) };
}

export function describeTrailPoint(index: number) {
	const { waypoint, miles } = getNearestWaypoint(index);
	return miles <= AT_WAYPOINT_MILES ? waypoint.name : `Near ${waypoint.name}`;
}

export function getMapDetailLevel(longitudeDelta: number = TRAIL_REGION.longitudeDelta) {
	return {
		showLabels: longitudeDelta < LABELS_MAX_LNG_DELTA,
		showMarkers: longitudeDelta < MARKERS_MAX_LNG_DELTA,
	};
}
