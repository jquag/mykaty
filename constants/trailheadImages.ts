import type { Waypoint } from "@/constants/waypoints";
import type { ImageSourcePropType } from "react-native";

const GENERIC = 'generic';

const trailheadImages: Record<string, ImageSourcePropType> = {
	machens: require('@/assets/images/trailheads/machens.jpg'),
	generic: require('@/assets/images/trailheads/generic.jpg'),
	blackWalnut: require('@/assets/images/trailheads/black-walnut.jpg'),
	saintCharles: require('@/assets/images/trailheads/saint-charles.jpg'),
	greensbottom: require('@/assets/images/trailheads/greensbottom.jpg'),
	weldonSpring: require('@/assets/images/trailheads/weldon-spring.jpg'),
	defiance: require('@/assets/images/trailheads/defiance.jpg'),
	matson: require('@/assets/images/trailheads/matson.jpg'),
	augusta: require('@/assets/images/trailheads/augusta.jpg'),
	dutzow: require('@/assets/images/trailheads/dutzow.jpg'),
	marthasville: require('@/assets/images/trailheads/marthasville.jpg'),
	treloar: require('@/assets/images/trailheads/treloar.jpg'),
	mcKittrick: require('@/assets/images/trailheads/mckittrick.jpg'),
	rhineland: require('@/assets/images/trailheads/rhineland.jpg'),
	bluffton: require('@/assets/images/trailheads/bluffton.jpg'),
	portland: require('@/assets/images/trailheads/portland.jpg'),
	steedman: require('@/assets/images/trailheads/steedman.jpg'),
	mokane: require('@/assets/images/trailheads/mokane.jpg'),
	tebbetts: require('@/assets/images/trailheads/tebbetts.jpg'),
	northJefferson: require('@/assets/images/trailheads/north-jefferson.jpg'),
	hartsburg: require('@/assets/images/trailheads/hartsburg.jpg'),
	providence: require('@/assets/images/trailheads/providence.jpg'),
	mcBaine: require('@/assets/images/trailheads/mcbaine.jpg'),
	huntsdale: require('@/assets/images/trailheads/huntsdale.jpg'),
};

export function getTrailheadImage(waypoint: Waypoint) {
	return trailheadImages[waypoint.image ?? GENERIC] ?? trailheadImages[GENERIC];
}

export function hasTrailheadPhoto(waypoint: Waypoint) {
	return waypoint.image !== undefined && waypoint.image !== GENERIC && waypoint.image in trailheadImages;
}
