import PoiMarker from "@/components/PoiMarker";
import SegmentStatusCard from "@/components/SegmentStatusCard";
import TrailheadMarker from "@/components/TrailheadMarker";
import DetailBottomSheet from "@/components/MapSheet/DetailBottomSheet";
import PoiDetail from "@/components/MapSheet/PoiDetail";
import MapListSheet from "@/components/MapSheet/MapListSheet";
import TrailheadDetail from "@/components/MapSheet/TrailheadDetail";
import TrailSegmentLayer from "@/components/TrailSegmentLayer";
import AppText from "@/components/ui/AppText";
import { waypoints } from "@/constants/waypoints";
import { usePois } from "@/contexts/PoisContext";
import useColors from "@/hooks/use-colors";
import usePlaceMap, { PLACE_SHEET_PARTIAL_HEIGHT } from "@/hooks/use-place-map";
import useTrailSegment from "@/hooks/use-trail-segment";
import { fitMapToCoordinates } from "@/utils/map";
import { getCategoryConfig } from "@/utils/pois";
import { getSegmentCoordinates, TRAIL_REGION, trailCoordinates } from "@/utils/trail";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { MapPressEvent, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

const MEASURE_FIT_MARGIN = 40;

export default function MapScreen() {
	const router = useRouter();
	const { trailhead } = useLocalSearchParams<{ trailhead?: string }>();
	const colors = useColors();
	const { attribution, enabledCategories, setCategoriesEnabled } = usePois();
	const {
		mapRef, listSheetRef, setRegion, mapHeight, setMapHeight, detailLevel,
		selected, selectedPoi, selectedWaypoint, selectedRoute, select, clearSelection,
		query, setQuery, poiMarkers, listPlaces, emptyMessage, showZoomHint,
	} = usePlaceMap(enabledCategories);
	const [mapReady, setMapReady] = useState(false);

	// Distance measuring state
	const [measureMode, setMeasureMode] = useState(false);
	const segment = useTrailSegment();
	const [measureOverlayTop, setMeasureOverlayTop] = useState(0);

	const handleMapPress = (event: MapPressEvent) => {
		if (!measureMode) return;
		const { latitude, longitude } = event.nativeEvent.coordinate;
		segment.selectAt(latitude, longitude);
	};

	// Zoom to fit the measured segment above the overlay
	const fitToMeasurement = () => {
		if (segment.start === null || segment.end === null) return;
		fitMapToCoordinates(mapRef.current, getSegmentCoordinates(segment.start, segment.end), {
			top: MEASURE_FIT_MARGIN,
			right: MEASURE_FIT_MARGIN,
			bottom: mapHeight - measureOverlayTop + MEASURE_FIT_MARGIN,
			left: MEASURE_FIT_MARGIN,
		});
	};

	const createTrip = () => {
		if (segment.start === null || segment.end === null) return;
		router.push({
			pathname: '/new-trip/details',
			params: { start: segment.start, end: segment.end },
		});
		segment.clear();
	};

	const enterMeasureMode = () => {
		Keyboard.dismiss();
		clearSelection();
		setMeasureMode(true);
	};

	const exitMeasureMode = () => {
		segment.clear();
		setMeasureMode(false);
	};

	const { showLabels, showMarkers } = detailLevel;

	// Other tabs focus a trailhead by navigating here with its name; the camera only moves once the map is ready
	useFocusEffect(useCallback(() => {
		if (!trailhead || !mapReady) return;
		router.setParams({ trailhead: undefined });
		const waypoint = waypoints.find(wp => wp.name === trailhead);
		if (!waypoint) return;
		segment.clear();
		setMeasureMode(false);
		setQuery('');
		select({ kind: 'trailhead', waypoint });
	}, [trailhead, mapReady, router, segment, setQuery, select]));

  return (
    <View style={{flex: 1}}>
			<MapView
				ref={mapRef}
				provider={PROVIDER_DEFAULT}
				initialRegion={TRAIL_REGION}
				onMapReady={() => setMapReady(true)}
				onRegionChangeComplete={setRegion}
				onPress={handleMapPress}
				onLayout={(e) => setMapHeight(e.nativeEvent.layout.height)}
				rotateEnabled={false}
				style={{
					flex: 1,
					width: '100%',
				}}
			>
				<Polyline
					coordinates={trailCoordinates}
					strokeColor={colors.accent()}
					strokeWidth={4}
				/>

				{!measureMode && selectedPoi && selectedRoute && (
					<Polyline
						coordinates={selectedRoute}
						strokeColor={getCategoryConfig(selectedPoi.category).color}
						strokeWidth={5}
						zIndex={1}
					/>
				)}

				<TrailSegmentLayer segment={segment} showLabels={showLabels} />

				{/* Hidden while measuring so dense town pins don't block taps on the trail */}
				{!measureMode && poiMarkers.map(poi => (
					<PoiMarker key={poi.id} poi={poi} focused={selectedPoi?.id === poi.id} onPress={() => select({ kind: 'poi', poi })} />
				))}

				{showMarkers && (!measureMode || showLabels) ? waypoints.map((waypoint, index) => (
					<TrailheadMarker key={index} waypoint={waypoint} showLabels={showLabels || selectedWaypoint === waypoint} focused={selectedWaypoint === waypoint} expandHitArea={!measureMode} onPress={measureMode ? undefined : () => select({ kind: 'trailhead', waypoint })} />
				)) : null}
			</MapView>
			{/* Trail button */}
			<Pressable
				onPress={() => mapRef.current?.animateToRegion(TRAIL_REGION)}
				style={{
					position: 'absolute',
					top: 20,
					right: 16,
					backgroundColor: colors.surface(.7),
					borderRadius: 8,
					padding: 8,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 4,
				}}
			>
				<Ionicons name="locate" size={18} color={colors.text()} />
				<AppText>Trail</AppText>
			</Pressable>

			{/* Distance button */}
			{!measureMode && (
				<Pressable
					onPress={enterMeasureMode}
					style={{
						position: 'absolute',
						top: 60,
						right: 16,
						backgroundColor: colors.surface(.7),
						borderRadius: 8,
						padding: 8,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 6,
					}}
				>
					<MaterialCommunityIcons name="ruler" size={18} color={colors.text()} />
					<AppText>Distance</AppText>
				</Pressable>
			)}

			{/* Measure overlay */}
			{measureMode && (
				<SegmentStatusCard
					segment={segment}
					onFit={fitToMeasurement}
					style={styles.measureOverlay}
					onLayout={(e) => setMeasureOverlayTop(e.nativeEvent.layout.y)}
					header={
						<View style={styles.measureHeader}>
							<View style={styles.measureRow}>
								<MaterialCommunityIcons name="ruler" size={18} color={colors.primary()} />
								<AppText style={styles.measureTitle}>Distance</AppText>
							</View>
							<Pressable
								onPress={segment.distance === null ? exitMeasureMode : segment.clear}
								style={[styles.clearButton, { backgroundColor: colors.accent() }]}
							>
								<AppText style={{ color: colors.surface() }}>
									{segment.distance === null ? 'Cancel' : 'Clear'}
								</AppText>
							</Pressable>
						</View>
					}
				>
					{segment.isComplete && (
						<Pressable
							onPress={createTrip}
							style={[styles.createTripButton, { backgroundColor: colors.primary() }]}
						>
							<Ionicons name="add-circle-outline" size={18} color={colors.surface()} />
							<AppText style={{ color: colors.surface(), fontWeight: '700' }}>Create trip</AppText>
						</Pressable>
					)}
				</SegmentStatusCard>
			)}

			{!measureMode && (
				<MapListSheet
					ref={listSheetRef}
					places={selected ? [] : listPlaces}
					emptyMessage={emptyMessage}
					showZoomHint={showZoomHint}
					query={query}
					onQueryChange={setQuery}
					enabledCategories={enabledCategories}
					onCategoriesChange={setCategoriesEnabled}
					partialOpenHeight={PLACE_SHEET_PARTIAL_HEIGHT}
					onPlaceSelected={select}
				/>
			)}
			{selected && (
				<DetailBottomSheet
					partialOpenHeight={PLACE_SHEET_PARTIAL_HEIGHT}
					onClose={clearSelection}
				>
					{selected.kind === 'poi'
						? <PoiDetail poi={selected.poi} attribution={attribution} />
						: <TrailheadDetail waypoint={selected.waypoint} />}
				</DetailBottomSheet>
			)}
    </View>
  );
}

const styles = StyleSheet.create({
	measureOverlay: {
		position: 'absolute',
		bottom: 16,
		left: 16,
		right: 16,
	},
	measureHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	measureRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexShrink: 1,
	},
	measureTitle: {
		fontWeight: 'bold',
	},
	clearButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	createTripButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 10,
		borderRadius: 8,
	},
});
