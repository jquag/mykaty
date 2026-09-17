import { Trip } from "@/types/Trip";
import { getNearestWaypoint, getTrailMiles, nearestTrailIndex } from "@/utils/trail";

function pad(value: number) {
	return String(value).padStart(2, '0');
}

export function toDateString(date: Date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeString(date: Date) {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function todayLocal() {
	return toDateString(new Date());
}

// Builds the Date from local parts: new Date('YYYY-MM-DD') would parse as UTC and shift the day
export function parseLocal(date: string, time?: string) {
	const [year, month, day] = date.split('-').map(Number);
	const [hours, minutes] = time ? time.split(':').map(Number) : [0, 0];
	return new Date(year, month - 1, day, hours, minutes);
}

export function formatDate(date: string) {
	return parseLocal(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(time: string) {
	return parseLocal(todayLocal(), time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatTripDate(trip: Pick<Trip, 'date' | 'time'>) {
	return trip.time ? `${formatDate(trip.date)}, ${formatTime(trip.time)}` : formatDate(trip.date);
}

// Newest first, ties broken by most recently created
export function compareTrips(a: Trip, b: Trip) {
	const aKey = `${a.date}T${a.time ?? '00:00'}`;
	const bKey = `${b.date}T${b.time ?? '00:00'}`;
	return bKey.localeCompare(aKey) || b.createdAt.localeCompare(a.createdAt);
}

export function getTripIndices(trip: Pick<Trip, 'start' | 'end'>) {
	return {
		start: nearestTrailIndex(trip.start.lat, trip.start.lng),
		end: nearestTrailIndex(trip.end.lat, trip.end.lng),
	};
}

export function getRouteName(startIndex: number, endIndex: number) {
	return `${getNearestWaypoint(startIndex).waypoint.name} to ${getNearestWaypoint(endIndex).waypoint.name}`;
}

export function getRouteMiles(startIndex: number, endIndex: number, isRoundTrip: boolean) {
	const miles = getTrailMiles(startIndex, endIndex);
	return isRoundTrip ? miles * 2 : miles;
}

export function getTripTitle(trip: Trip) {
	if (trip.title) return trip.title;
	const { start, end } = getTripIndices(trip);
	return getRouteName(start, end);
}

export function getTripMiles(trip: Trip) {
	const { start, end } = getTripIndices(trip);
	return getRouteMiles(start, end, trip.isRoundTrip);
}
