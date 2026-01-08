import { Trip } from "@/types/Trip";

export function getStartDateTime(trip: Trip): Date {
	const date = new Date(trip.startDate);
	if (trip.startTime) {
		const time = new Date(trip.startTime);
		date.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
	}
	return date;
}
