import { trailPoints } from "@/constants/trailPoints";
import { getWaypointIndices } from "@/utils/trail";

export const OUTLINE_WIDTH = 300;
const PAD_X = 8;
// Room above and below the trail for place labels
const PAD_Y = 14;
const MIN_POINT_SPACING = 1.5;
// Room around a single stretch of trail for the markers drawn on it
const SEGMENT_PAD = 14;
const SEGMENT_MIN_HEIGHT = 100;
const SEGMENT_MAX_HEIGHT = 160;
// Longitude degrees shrink by cos(latitude); the trail sits near 38.7°N
const LNG_SCALE = Math.cos(38.7 * Math.PI / 180);

export interface Point {
	x: number;
	y: number;
}

interface Outline {
	height: number;
	project: (index: number) => Point;
	keptIndices: number[];
	keptPoints: Point[];
}

let outline: Outline | null = null;

function buildOutline(): Outline {
	let minLat = Infinity;
	let maxLat = -Infinity;
	let minLng = Infinity;
	let maxLng = -Infinity;
	for (const point of trailPoints) {
		minLat = Math.min(minLat, point.lat);
		maxLat = Math.max(maxLat, point.lat);
		minLng = Math.min(minLng, point.lng);
		maxLng = Math.max(maxLng, point.lng);
	}

	const scale = (OUTLINE_WIDTH - PAD_X * 2) / ((maxLng - minLng) * LNG_SCALE);
	const height = (maxLat - minLat) * scale + PAD_Y * 2;
	const project = (index: number): Point => ({
		x: PAD_X + (trailPoints[index].lng - minLng) * LNG_SCALE * scale,
		y: PAD_Y + (maxLat - trailPoints[index].lat) * scale,
	});

	return { height, project, ...thin(project, 0, trailPoints.length - 1) };
}

// Drops points too close to the last kept one to show, always keeping both ends
function thin(project: (index: number) => Point, from: number, to: number) {
	const keptIndices = [from];
	const keptPoints = [project(from)];
	for (let i = from + 1; i < to; i++) {
		const point = project(i);
		const last = keptPoints[keptPoints.length - 1];
		if (Math.hypot(point.x - last.x, point.y - last.y) >= MIN_POINT_SPACING) {
			keptIndices.push(i);
			keptPoints.push(point);
		}
	}
	keptIndices.push(to);
	keptPoints.push(project(to));
	return { keptIndices, keptPoints };
}

function getOutline() {
	outline ??= buildOutline();
	return outline;
}

export function getOutlineHeight() {
	return getOutline().height;
}

function firstKeptAfter(index: number) {
	const { keptIndices } = getOutline();
	let low = 0;
	let high = keptIndices.length;
	while (low < high) {
		const mid = (low + high) >> 1;
		if (keptIndices[mid] <= index) low = mid + 1;
		else high = mid;
	}
	return low;
}

function formatPoint({ x, y }: Point) {
	return `${x.toFixed(1)},${y.toFixed(1)}`;
}

/** SVG path data for the trail between two indices, exact at both ends */
export function outlinePath(startIndex: number, endIndex: number) {
	const { project, keptIndices, keptPoints } = getOutline();
	const from = Math.min(startIndex, endIndex);
	const to = Math.max(startIndex, endIndex);
	const points = [project(from)];
	for (let k = firstKeptAfter(from); k < keptIndices.length && keptIndices[k] < to; k++) {
		points.push(keptPoints[k]);
	}
	points.push(project(to));
	return `M${points.map(formatPoint).join('L')}`;
}

export function fullOutlinePath() {
	return outlinePath(0, trailPoints.length - 1);
}

/** Drawing positions of the waypoints, in waypoint order */
export function getWaypointPositions() {
	const { project } = getOutline();
	return getWaypointIndices().map(project);
}

/**
 * A drawing of just the trail between two indices, scaled to fill OUTLINE_WIDTH.
 * Its height follows the stretch's shape within limits, so an east-west stretch doesn't flatten into a line.
 */
export function getSegmentOutline(startIndex: number, endIndex: number) {
	const from = Math.min(startIndex, endIndex);
	const to = Math.max(startIndex, endIndex);
	let minLat = Infinity;
	let maxLat = -Infinity;
	let minLng = Infinity;
	let maxLng = -Infinity;
	for (let i = from; i <= to; i++) {
		minLat = Math.min(minLat, trailPoints[i].lat);
		maxLat = Math.max(maxLat, trailPoints[i].lat);
		minLng = Math.min(minLng, trailPoints[i].lng);
		maxLng = Math.max(maxLng, trailPoints[i].lng);
	}

	const spanX = Math.max((maxLng - minLng) * LNG_SCALE, 1e-6);
	const spanY = Math.max(maxLat - minLat, 1e-6);
	const innerWidth = OUTLINE_WIDTH - SEGMENT_PAD * 2;
	const height = Math.min(Math.max(spanY * innerWidth / spanX + SEGMENT_PAD * 2, SEGMENT_MIN_HEIGHT), SEGMENT_MAX_HEIGHT);
	const scale = Math.min(innerWidth / spanX, (height - SEGMENT_PAD * 2) / spanY);
	const offsetX = (OUTLINE_WIDTH - spanX * scale) / 2;
	const offsetY = (height - spanY * scale) / 2;
	const project = (index: number): Point => ({
		x: offsetX + (trailPoints[index].lng - minLng) * LNG_SCALE * scale,
		y: offsetY + (maxLat - trailPoints[index].lat) * scale,
	});

	const { keptPoints } = thin(project, from, to);
	return { width: OUTLINE_WIDTH, height, path: `M${keptPoints.map(formatPoint).join('L')}`, project };
}
