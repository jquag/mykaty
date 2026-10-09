import { trailPoints } from "@/constants/trailPoints";
import { getWaypointIndices } from "@/utils/trail";

export const OUTLINE_WIDTH = 300;
const PAD_X = 8;
// Room above and below the trail for place labels
const PAD_Y = 14;
const MIN_POINT_SPACING = 1.5;
// Longitude degrees shrink by cos(latitude); the trail sits near 38.7°N
const LNG_SCALE = Math.cos(38.7 * Math.PI / 180);

interface Point {
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

	const keptIndices = [0];
	const keptPoints = [project(0)];
	for (let i = 1; i < trailPoints.length - 1; i++) {
		const point = project(i);
		const last = keptPoints[keptPoints.length - 1];
		if (Math.hypot(point.x - last.x, point.y - last.y) >= MIN_POINT_SPACING) {
			keptIndices.push(i);
			keptPoints.push(point);
		}
	}
	keptIndices.push(trailPoints.length - 1);
	keptPoints.push(project(trailPoints.length - 1));

	return { height, project, keptIndices, keptPoints };
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
