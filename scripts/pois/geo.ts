export interface LatLng {
	lat: number;
	lng: number;
}

export type Segment = [LatLng, LatLng];

const EARTH_RADIUS_MILES = 3959;
const MILES_PER_LAT_DEGREE = 69.05;
const RAD = Math.PI / 180;

export function haversineMiles(a: LatLng, b: LatLng) {
	const dLat = (b.lat - a.lat) * RAD;
	const dLng = (b.lng - a.lng) * RAD;
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export function cumulativeMiles(line: LatLng[]) {
	const miles = new Array<number>(line.length);
	miles[0] = 0;
	for (let i = 1; i < line.length; i++) {
		miles[i] = miles[i - 1] + haversineMiles(line[i - 1], line[i]);
	}
	return miles;
}

export function boundingBox(points: LatLng[], padMiles: number) {
	let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
	for (const p of points) {
		if (p.lat < minLat) minLat = p.lat;
		if (p.lat > maxLat) maxLat = p.lat;
		if (p.lng < minLng) minLng = p.lng;
		if (p.lng > maxLng) maxLng = p.lng;
	}
	const padLat = padMiles / MILES_PER_LAT_DEGREE;
	const padLng = padLat / Math.cos(((minLat + maxLat) / 2) * RAD);
	return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
}

// Returns the index of the closest line vertex and the distance to it, or null when nothing is within maxMiles
export function nearestOnLine(point: LatLng, line: LatLng[], maxMiles: number) {
	const lngScale = Math.cos(point.lat * RAD);
	const maxDegrees = (maxMiles / MILES_PER_LAT_DEGREE) * 1.05;
	let bestIndex = -1;
	let bestSquared = maxDegrees * maxDegrees;
	for (let i = 0; i < line.length; i++) {
		const dLat = line[i].lat - point.lat;
		if (dLat > maxDegrees || dLat < -maxDegrees) continue;
		const dLng = (line[i].lng - point.lng) * lngScale;
		const squared = dLat * dLat + dLng * dLng;
		if (squared < bestSquared) {
			bestSquared = squared;
			bestIndex = i;
		}
	}
	if (bestIndex < 0) return null;
	const miles = haversineMiles(point, line[bestIndex]);
	return miles <= maxMiles ? { index: bestIndex, miles } : null;
}

function cross(o: LatLng, a: LatLng, b: LatLng) {
	return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
}

export function segmentsIntersect([a, b]: Segment, [c, d]: Segment) {
	if (Math.max(a.lng, b.lng) < Math.min(c.lng, d.lng) || Math.max(c.lng, d.lng) < Math.min(a.lng, b.lng)) return false;
	if (Math.max(a.lat, b.lat) < Math.min(c.lat, d.lat) || Math.max(c.lat, d.lat) < Math.min(a.lat, b.lat)) return false;
	const d1 = cross(c, d, a);
	const d2 = cross(c, d, b);
	const d3 = cross(a, b, c);
	const d4 = cross(a, b, d);
	return d1 * d2 < 0 && d3 * d4 < 0;
}

const NAME_NOISE = /\b(the|bed and breakfast|bed breakfast|b and b|bnb|bb|inn|llc|inc|co|company|restaurant|of|at|and)\b/g;

export function normalizeName(name: string) {
	const cleaned = name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9 ]/g, " ")
		.replace(/\s+/g, " ");
	const stripped = cleaned.replace(NAME_NOISE, " ").replace(/\s+/g, "");
	return stripped || cleaned.replace(/\s+/g, "");
}
