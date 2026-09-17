import SegmentStatusCard from "@/components/SegmentStatusCard";
import TrailheadMarker from "@/components/TrailheadMarker";
import TrailheadBottomSheet from "@/components/TrailheadBottomSheet/TrailheadBottomSheet";
import TrailheadDetailBottomSheet from "@/components/TrailheadBottomSheet/TrailheadDetailBottomSheet";
import TrailSegmentLayer from "@/components/TrailSegmentLayer";
import AppText from "@/components/ui/AppText";
import { Waypoint, waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import useTrailSegment from "@/hooks/use-trail-segment";
import { fitMapToCoordinates } from "@/utils/map";
import { getMapDetailLevel, getSegmentCoordinates, TRAIL_REGION, trailCoordinates } from "@/utils/trail";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { MapPressEvent, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';

const BOTTOM_SHEET_PARTIAL_OPEN_PERCENT = 0.4;
const BOTTOM_SHEET_COLLAPSED_HEIGHT = 45;
const MEASURE_FIT_MARGIN = 40;

export default function Index() {
	const router = useRouter();
	const mapRef = useRef<MapView>(null);
	const listSheetRef = useRef<BottomSheet>(null);
	const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
	const colors = useColors();
	const [selectedPoi, setSelectedPoi] = useState<Waypoint | null>(null);

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
	};

	const exitMeasureMode = () => {
		segment.clear();
		setMeasureMode(false);
	};

	const { showLabels, showMarkers } = getMapDetailLevel(currentRegion?.longitudeDelta);

	// Filter waypoints to those visible in the current viewport
	const visibleWaypoints = useMemo(() => {
		if (!currentRegion || !showMarkers) return [];
		return waypoints.filter(wp => {
			const latDiff = Math.abs(wp.lat - currentRegion.latitude);
			const lngDiff = Math.abs(wp.lng - currentRegion.longitude);
			return latDiff < currentRegion.latitudeDelta / 2 &&
				lngDiff < currentRegion.longitudeDelta / 2;
		});
	}, [currentRegion, showMarkers]);

	// Handle trailhead press from bottom sheet
	// Offset the center so the marker appears in the visible area above the sheet
	const handlePoiSelected = useCallback((waypoint: Waypoint) => {
		setSelectedPoi(waypoint);
		listSheetRef.current?.snapToIndex(0); // Minimize list sheet

		const latDelta = currentRegion?.latitudeDelta ?? 0.05;
		const latOffset = (latDelta * BOTTOM_SHEET_PARTIAL_OPEN_PERCENT) / 2;

		mapRef.current?.animateToRegion({
			latitude: waypoint.lat - latOffset,
			longitude: waypoint.lng,
			latitudeDelta: latDelta,
			longitudeDelta: currentRegion?.longitudeDelta ?? 0.05,
		}, 500);
	}, [currentRegion]);

	const handleClearPoiSelection = useCallback(() => {
		setSelectedPoi(null);
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

				{showMarkers && (!measureMode || showLabels) ? waypoints.map((waypoint, index) => (
					<TrailheadMarker key={index} waypoint={waypoint} showLabels={showLabels || selectedPoi === waypoint} focused={selectedPoi === waypoint} expandHitArea={!measureMode} onPress={measureMode ? undefined : () => handlePoiSelected(waypoint)} />
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
								onPress={exitMeasureMode}
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

			<TrailheadBottomSheet
				ref={listSheetRef}
				waypoints={selectedPoi ? [] : visibleWaypoints}
				partialOpenHeight={BOTTOM_SHEET_PARTIAL_OPEN_PERCENT * 100 + '%'}
				onPoiSelected={handlePoiSelected}
			/>
			{selectedPoi && (
				<TrailheadDetailBottomSheet
					waypoint={selectedPoi}
					partialOpenHeight={BOTTOM_SHEET_PARTIAL_OPEN_PERCENT * 100 + '%'}
					onClose={handleClearPoiSelection}
				/>
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
