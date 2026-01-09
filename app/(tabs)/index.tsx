import TrailheadMarker from "@/components/TrailheadMarker";
import { trailPoints } from "@/constants/trailPoints";
import { waypoints } from "@/constants/waypoints";
import { getTrailRegion } from "@/utils/trail";
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';

export default function Index() {
	const mapRef = useRef<MapView>(null);
	const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

	const { showLabels, showMarkers } = useMemo(() => {
		const delta = currentRegion?.latitudeDelta ?? getTrailRegion().latitudeDelta;
		return { showLabels: delta < 2, showMarkers: delta < 6 };
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
			<Pressable
				onPress={() => mapRef.current?.animateToRegion(getTrailRegion())}
				style={{
					position: 'absolute',
					top: 60,
					right: 16,
					backgroundColor: 'rgba(255, 255, 255, 0.7)',
					borderRadius: 8,
					padding: 8,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 4,
				}}
			>
				<Ionicons name="locate" size={18} color="#333" />
				<Text>Trail</Text>
			</Pressable>
    </View>
  );
}
