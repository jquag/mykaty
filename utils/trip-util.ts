import { Trip } from "@/types/Trip";
import { getNearestWaypoint, getTrailMiles, trailIndexOf } from "@/utils/trail";

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

// A trip without a time stays upcoming for the whole day it's planned
export function isTripCompleted(trip: Pick<Trip, 'date' | 'time'>, now: Date) {
	return trip.time ? parseLocal(trip.date, trip.time) <= now : trip.date < toDateString(now);
}

// Expects trips in context order (newest first); upcoming comes back soonest first
export function splitTrips(trips: Trip[], now: Date) {
	const completed: Trip[] = [];
	const upcoming: Trip[] = [];
	for (const trip of trips) {
		if (isTripCompleted(trip, now)) completed.push(trip);
		else upcoming.unshift(trip);
	}
	return { completed, upcoming };
}

// Rounded because a DST change makes a calendar day 23 or 25 hours long
export function daysBetween(from: string, to: string) {
	return Math.round((parseLocal(to).getTime() - parseLocal(from).getTime()) / 86_400_000);
}

export function describeDaysUntil(days: number) {
	if (days <= 0) return 'today';
	if (days === 1) return 'tomorrow';
	return `in ${days} days`;
}

// Newest first, ties broken by most recently created
export function compareTrips(a: Trip, b: Trip) {
	const aKey = `${a.date}T${a.time ?? '00:00'}`;
	const bKey = `${b.date}T${b.time ?? '00:00'}`;
	return bKey.localeCompare(aKey) || b.createdAt.localeCompare(a.createdAt);
}

export function getTripIndices(trip: Pick<Trip, 'start' | 'end'>) {
	return {
		start: trailIndexOf(trip.start),
		end: trailIndexOf(trip.end),
	};
}

export function getRouteName(startIndex: number, endIndex: number) {
	return `${getNearestWaypoint(startIndex).waypoint.name} to ${getNearestWaypoint(endIndex).waypoint.name}`;
}

export function getRouteMiles(startIndex: number, endIndex: number, isRoundTrip: boolean) {
	const miles = getTrailMiles(startIndex, endIndex);
	return isRoundTrip ? miles * 2 : miles;
}

export function getTripSummary(trip: Trip) {
	const { start, end } = getTripIndices(trip);
	return {
		title: trip.title || getRouteName(start, end),
		miles: getRouteMiles(start, end, trip.isRoundTrip),
	};
}
