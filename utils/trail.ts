import { trailPoints } from "@/constants/trailPoints";

	// Calculate region that encompasses all trail points
	export function getTrailRegion() {
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
	};
