import TrailheadMarker from "@/components/TrailheadMarker";
import { trailPoints } from "@/constants/trailPoints";
import { waypoints } from "@/constants/waypoints";
import { getTrailRegion } from "@/utils/trail";
import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';

export default function Index() {
	const mapRef = useRef<MapView>(null);
	const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

	const { showLabels, showMarkers } = useMemo(() => {
		const delta = currentRegion?.latitudeDelta ?? getTrailRegion().latitudeDelta;

		const showLabels = delta < 2;
		const showMarkers = delta < 6;

		return { showLabels, showMarkers };
	}, [currentRegion?.latitudeDelta]);

  return (
    <View style={{flex: 1}}>
			<MapView
				ref={mapRef}
				provider={PROVIDER_DEFAULT}
				initialRegion={getTrailRegion()}
				onRegionChangeComplete={setCurrentRegion}
				rotateEnabled={false}
				style={{
					flex: 1,
					width: '100%',
				}}
			>
				<Polyline
					coordinates={trailPoints.map(point => ({
						latitude: point.lat,
						longitude: point.lng
					}))}
					strokeColor={"orange"}
					strokeWidth={3}
				/>
				{showMarkers ? waypoints.map((waypoint, index) => (
					<TrailheadMarker key={index} waypoint={waypoint} showLabels={showLabels} markerSize={14} />
				)) : null}
			</MapView>
			
    </View>
  );
}
