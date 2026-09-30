import PoiMarker from "@/components/PoiMarker";
import SegmentStatusCard from "@/components/SegmentStatusCard";
import TrailheadMarker from "@/components/TrailheadMarker";
import DetailBottomSheet from "@/components/MapSheet/DetailBottomSheet";
import PoiDetail from "@/components/MapSheet/PoiDetail";
import MapListSheet, { BOTTOM_SHEET_COLLAPSED_HEIGHT } from "@/components/MapSheet/MapListSheet";
import TrailheadDetail from "@/components/MapSheet/TrailheadDetail";
import TrailSegmentLayer from "@/components/TrailSegmentLayer";
import AppText from "@/components/ui/AppText";
import { Poi } from "@/constants/pois";
import { waypoints } from "@/constants/waypoints";
import { usePois } from "@/contexts/PoisContext";
import useColors from "@/hooks/use-colors";
import useTrailSegment from "@/hooks/use-trail-segment";
import { Place } from "@/types/Place";
import { fitMapToCoordinates, isInRegion } from "@/utils/map";
import { compareByTrailMile, isSearchQuery, searchPlaces } from "@/utils/pois";
import { getMapDetailLevel, getSegmentCoordinates, TRAIL_REGION, trailCoordinates } from "@/utils/trail";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { MapPressEvent, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';

const BOTTOM_SHEET_PARTIAL_OPEN_PERCENT = 0.4;
const MEASURE_FIT_MARGIN = 40;
const MAX_VISIBLE_POIS = 100;
// Zoom used when selecting a place whose pin isn't shown at the current zoom, such as a search result
const SELECTED_PLACE_DELTA = 0.04;

export default function Index() {
	const router = useRouter();
	const mapRef = useRef<MapView>(null);
	const listSheetRef = useRef<BottomSheet>(null);
	const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
	const colors = useColors();
	const [selected, setSelected] = useState<Place | null>(null);
	const [query, setQuery] = useState('');
	const { pois, attribution, enabledCategories, allCategoriesEnabled } = usePois();

	// Distance measuring state
	const [measureMode, setMeasureMode] = useState(false);
	const segment = useTrailSegment();
	const [measureOverlayBottom, setMeasureOverlayBottom] = useState(0);

	const handleMapPress = (event: MapPressEvent) => {
		if (!measureMode) return;
		const { latitude, longitude } = event.nativeEvent.coordinate;
		segment.selectAt(latitude, longitude);
	};

	// Zoom to fit the measured segment between the overlay and the collapsed bottom sheet
	const fitToMeasurement = () => {
		if (segment.start === null || segment.end === null) return;
		listSheetRef.current?.snapToIndex(0);
		fitMapToCoordinates(mapRef.current, getSegmentCoordinates(segment.start, segment.end), {
			top: measureOverlayBottom + MEASURE_FIT_MARGIN,
			right: MEASURE_FIT_MARGIN,
			bottom: BOTTOM_SHEET_COLLAPSED_HEIGHT + MEASURE_FIT_MARGIN,
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

	const exitMeasureMode = () => {
		segment.clear();
		setMeasureMode(false);
	};

	const { showLabels, showMarkers, showPois } = getMapDetailLevel(currentRegion?.longitudeDelta);

	// Filter waypoints to those visible in the current viewport
	const visibleWaypoints = useMemo(() => {
		if (!currentRegion || !showMarkers) return [];
		return waypoints.filter(wp => isInRegion(wp, currentRegion));
	}, [currentRegion, showMarkers]);

	// POIs of the enabled categories in the viewport, limited to those nearest the center in busy towns.
	// Categories without a chip only appear when every chip is on.
	const visiblePois = useMemo(() => {
		if (!currentRegion || !showPois || enabledCategories.size === 0) return [];
		const inView = pois.filter(poi =>
			(allCategoriesEnabled || enabledCategories.has(poi.category)) && isInRegion(poi, currentRegion));
		if (inView.length <= MAX_VISIBLE_POIS) return inView;
		const distanceFromCenter = (poi: Poi) =>
			(poi.lat - currentRegion.latitude) ** 2 + (poi.lng - currentRegion.longitude) ** 2;
		return inView
			.sort((a, b) => distanceFromCenter(a) - distanceFromCenter(b))
			.slice(0, MAX_VISIBLE_POIS);
	}, [pois, enabledCategories, allCategoriesEnabled, currentRegion, showPois]);

	const selectedWaypoint = selected?.kind === 'trailhead' ? selected.waypoint : null;
	const selectedPoi = selected?.kind === 'poi' ? selected.poi : null;

	// The selected POI stays on the map even when its category is off or the map has moved away
	const poiMarkers = selectedPoi && !visiblePois.some(poi => poi.id === selectedPoi.id)
		? [...visiblePois, selectedPoi]
		: visiblePois;

	const searching = isSearchQuery(query);
	const listPlaces = useMemo(() => {
		if (searching) return searchPlaces(query, pois);
		const places: Place[] = [
			...visibleWaypoints.map(waypoint => ({ kind: 'trailhead' as const, waypoint })),
			...visiblePois.map(poi => ({ kind: 'poi' as const, poi })),
		];
		return places.sort(compareByTrailMile);
	}, [searching, query, pois, visibleWaypoints, visiblePois]);

	let emptyMessage = 'Zoom in to see trailheads';
	if (searching) {
		emptyMessage = 'No places match';
	} else if (enabledCategories.size > 0) {
		emptyMessage = 'Zoom in to see trailheads and places';
	}

	// Offset the center so the marker appears in the visible area above the sheet
	const handleSelect = useCallback((place: Place) => {
		setSelected(place);
		Keyboard.dismiss();
		listSheetRef.current?.snapToIndex(0); // Minimize list sheet

		const detailLevel = getMapDetailLevel(currentRegion?.longitudeDelta);
		const pinShown = place.kind === 'poi' ? detailLevel.showPois : detailLevel.showMarkers;
		const keepZoom = currentRegion !== null && pinShown;
		const latitudeDelta = keepZoom ? currentRegion.latitudeDelta : SELECTED_PLACE_DELTA;
		const longitudeDelta = keepZoom ? currentRegion.longitudeDelta : SELECTED_PLACE_DELTA;
		const latOffset = (latitudeDelta * BOTTOM_SHEET_PARTIAL_OPEN_PERCENT) / 2;
		const { lat, lng } = place.kind === 'poi' ? place.poi : place.waypoint;

		mapRef.current?.animateToRegion({
			latitude: lat - latOffset,
			longitude: lng,
			latitudeDelta,
			longitudeDelta,
		}, 500);
	}, [currentRegion]);

	const handleClearSelection = useCallback(() => {
		setSelected(null);
	}, []);

  return (
    <View style={{flex: 1}}>
			<MapView
				ref={mapRef}
				provider={PROVIDER_DEFAULT}
				initialRegion={TRAIL_REGION}
				onRegionChangeComplete={setCurrentRegion}
				onPress={handleMapPress}
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

				<TrailSegmentLayer segment={segment} showLabels={showLabels} />

				{/* Hidden while measuring so dense town pins don't block taps on the trail */}
				{!measureMode && poiMarkers.map(poi => (
					<PoiMarker key={poi.id} poi={poi} focused={selectedPoi?.id === poi.id} onPress={() => handleSelect({ kind: 'poi', poi })} />
				))}

				{showMarkers && (!measureMode || showLabels) ? waypoints.map((waypoint, index) => (
					<TrailheadMarker key={index} waypoint={waypoint} showLabels={showLabels || selectedWaypoint === waypoint} focused={selectedWaypoint === waypoint} expandHitArea={!measureMode} onPress={measureMode ? undefined : () => handleSelect({ kind: 'trailhead', waypoint })} />
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
				{!measureMode && <AppText>Trail</AppText>}
			</Pressable>

			{/* Distance button */}
			{!measureMode && (
				<Pressable
					onPress={() => setMeasureMode(true)}
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
					onLayout={(e) => setMeasureOverlayBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
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

			<MapListSheet
				ref={listSheetRef}
				places={selected ? [] : listPlaces}
				emptyMessage={emptyMessage}
				query={query}
				onQueryChange={setQuery}
				partialOpenHeight={BOTTOM_SHEET_PARTIAL_OPEN_PERCENT * 100 + '%'}
				onPlaceSelected={handleSelect}
			/>
			{selected && (
				<DetailBottomSheet
					partialOpenHeight={BOTTOM_SHEET_PARTIAL_OPEN_PERCENT * 100 + '%'}
					onClose={handleClearSelection}
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
		top: 20,
		left: 16,
		right: 58,
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
