import { WINTER_CLOSURE } from "@/constants/waypoints";
import { daysBetween, toDateString } from "@/utils/trip-util";

const LEAD_DAYS = 28;

function isInWinterClosure(date: string) {
	const monthDay = date.slice(5);
	return monthDay >= WINTER_CLOSURE.from || monthDay < WINTER_CLOSURE.until;
}

export function getWinterClosureNotice(now: Date, nextTripDate?: string) {
	const today = toDateString(now);
	const nextClosure = `${now.getFullYear()}-${WINTER_CLOSURE.from}`;
	const daysUntilClosure = daysBetween(today, nextClosure);
	const show = isInWinterClosure(today)
		|| (daysUntilClosure > 0 && daysUntilClosure <= LEAD_DAYS)
		|| (nextTripDate !== undefined && isInWinterClosure(nextTripDate));
	return show ? 'Trailhead restrooms and water are off Nov 1 to Apr 1' : null;
}
