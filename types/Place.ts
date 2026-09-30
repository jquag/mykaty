import type { Poi } from '@/constants/pois';
import type { Waypoint } from '@/constants/waypoints';

export type Place =
	| { kind: 'trailhead'; waypoint: Waypoint }
	| { kind: 'poi'; poi: Poi };
