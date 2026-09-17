import MeasureMarker from "@/components/MeasureMarker";
import TrailheadMarker from "@/components/TrailheadMarker";
import TrailheadBottomSheet from "@/components/TrailheadBottomSheet/TrailheadBottomSheet";
import TrailheadDetailBottomSheet from "@/components/TrailheadBottomSheet/TrailheadDetailBottomSheet";
import AppText from "@/components/ui/AppText";
import { trailPoints } from "@/constants/trailPoints";
import { Waypoint, waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import { getTrailRegion } from "@/utils/trail";
import { calculateTrailDistance } from "@/utils/map";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import { PixelRatio, Platform, View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { MapPressEvent, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';

const BOTTOM_SHEET_PARTIAL_OPEN_PERCENT = 0.4;
const BOTTOM_SHEET_COLLAPSED_HEIGHT = 45;
const MEASURE_FIT_MARGIN = 40;

export default function Index() {
	const mapRef = useRef<MapView>(null);
	const listSheetRef = useRef<BottomSheet>(null);
	const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
	const colors = useColors();
	const [selectedPoi, setSelectedPoi] = useState<Waypoint | null>(null);

	// Distance measuring state
	const [measureMode, setMeasureMode] = useState(false);
	const [measurementPoints, setMeasurementPoints] = useState<{
		start: number | null;
		end: number | null;
	}>({ start: null, end: null });
	const [markerKeys, setMarkerKeys] = useState({ start: 0, end: 0 });
	const [measureOverlayBottom, setMeasureOverlayBottom] = useState(0);

	// Find the nearest trail point to a given coordinate
	const findNearestTrailPoint = useCallback((clickLat: number, clickLng: number): number => {
		// First check if click is near a waypoint (within ~100 meters)
		const waypointThreshold = 0.001;
		for (const waypoint of waypoints) {
			const latDiff = Math.abs(waypoint.lat - clickLat);
			const lngDiff = Math.abs(waypoint.lng - clickLng);
			if (latDiff < waypointThreshold && lngDiff < waypointThreshold) {
				// Find the closest trail point index to this waypoint
				let closestIndex = 0;
				let closestDistance = Infinity;
				for (let j = 0; j < trailPoints.length; j++) {
					const dist = Math.abs(trailPoints[j].lat - waypoint.lat) +
						Math.abs(trailPoints[j].lng - waypoint.lng);
					if (dist < closestDistance) {
						closestDistance = dist;
						closestIndex = j;
					}
				}
				return closestIndex;
			}
		}

		// Find nearest trail point by longitude (trail runs roughly east-west)
		let closestIndex = 0;
		let closestDistance = Infinity;
		for (let i = 0; i < trailPoints.length; i++) {
			const dist = Math.abs(trailPoints[i].lng - clickLng);
			if (dist < closestDistance) {
				closestDistance = dist;
				closestIndex = i;
			}
		}
		return closestIndex;
	}, []);

	// Handle map press for distance measuring
	const handleMapPress = useCallback((event: MapPressEvent) => {
		if (!measureMode) return;

		const { coordinate } = event.nativeEvent;
		const nearestIndex = findNearestTrailPoint(coordinate.latitude, coordinate.longitude);

		if (measurementPoints.start === null) {
			setMeasurementPoints({ start: nearestIndex, end: null });
		} else if (measurementPoints.end === null) {
			setMeasurementPoints(prev => ({ ...prev, end: nearestIndex }));
		}
	}, [measureMode, measurementPoints.start, measurementPoints.end, findNearestTrailPoint]);

	// Calculate distance when both points are set
	const measuredDistance = useMemo(() => {
		if (measurementPoints.start === null || measurementPoints.end === null) return null;
		return calculateTrailDistance(trailPoints, measurementPoints.start, measurementPoints.end);
	}, [measurementPoints.start, measurementPoints.end]);

	// Zoom to fit the measured segment between the overlay and the collapsed bottom sheet
	const fitToMeasurement = useCallback(() => {
		if (measurementPoints.start === null || measurementPoints.end === null) return;
		listSheetRef.current?.snapToIndex(0);

		const coordinates = trailPoints.slice(
			Math.min(measurementPoints.start, measurementPoints.end),
			Math.max(measurementPoints.start, measurementPoints.end) + 1
		).map(point => ({ latitude: point.lat, longitude: point.lng }));

		// Android expects edge padding in pixels, iOS in points
		const scale = Platform.OS === 'android' ? PixelRatio.get() : 1;
		mapRef.current?.fitToCoordinates(coordinates, {
			edgePadding: {
				top: (measureOverlayBottom + MEASURE_FIT_MARGIN) * scale,
				right: MEASURE_FIT_MARGIN * scale,
				bottom: (BOTTOM_SHEET_COLLAPSED_HEIGHT + MEASURE_FIT_MARGIN) * scale,
				left: MEASURE_FIT_MARGIN * scale,
			},
			animated: true,
		});
	}, [measurementPoints.start, measurementPoints.end, measureOverlayBottom]);

	// Toggle measure mode
	const toggleMeasureMode = useCallback(() => {
		if (measureMode) {
			setMeasureMode(false);
			setMeasurementPoints({ start: null, end: null });
		} else {
			setMeasureMode(true);
		}
	}, [measureMode]);

	// Clear measurement
	const clearMeasurement = useCallback(() => {
		setMeasurementPoints({ start: null, end: null });
		setMeasureMode(false);
	}, []);

	const { showLabels, showMarkers } = useMemo(() => {
		const delta = currentRegion?.latitudeDelta ?? getTrailRegion().latitudeDelta;
		return { showLabels: delta < 1.2, showMarkers: delta < 6 };
	}, [currentRegion?.latitudeDelta]);

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
				initialRegion={getTrailRegion()}
				onRegionChangeComplete={setCurrentRegion}
				onPress={handleMapPress}
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
					strokeColor={colors.accent()}
					strokeWidth={4}
				/>

				{/* Highlighted trail segment when measuring */}
				{measurementPoints.start !== null && measurementPoints.end !== null && (
					<Polyline
						coordinates={trailPoints.slice(
							Math.min(measurementPoints.start, measurementPoints.end),
							Math.max(measurementPoints.start, measurementPoints.end) + 1
						).map(point => ({
							latitude: point.lat,
							longitude: point.lng
						}))}
						strokeColor={colors.primary()}
						strokeWidth={8}
					/>
				)}

				{showMarkers && (!measureMode || showLabels) ? waypoints.map((waypoint, index) => (
					<TrailheadMarker key={index} waypoint={waypoint} showLabels={showLabels || selectedPoi === waypoint} focused={selectedPoi === waypoint} expandHitArea={!measureMode} onPress={measureMode ? undefined : () => handlePoiSelected(waypoint)} />
				)) : null}

				{/* Start marker */}
				{measurementPoints.start !== null && (
					<MeasureMarker
						label="A"
						markerKey={`start-${markerKeys.start}-${showLabels}`}
						coordinate={{
							latitude: trailPoints[measurementPoints.start].lat,
							longitude: trailPoints[measurementPoints.start].lng,
						}}
						showLabels={showLabels}
						onDrag={(e) => {
							const nearestIndex = findNearestTrailPoint(
								e.nativeEvent.coordinate.latitude,
								e.nativeEvent.coordinate.longitude
							);
							setMeasurementPoints(prev => ({ ...prev, start: nearestIndex }));
						}}
						onDragEnd={(e) => {
							const nearestIndex = findNearestTrailPoint(
								e.nativeEvent.coordinate.latitude,
								e.nativeEvent.coordinate.longitude
							);
							setMeasurementPoints(prev => ({ ...prev, start: nearestIndex }));
							setMarkerKeys(prev => ({ ...prev, start: prev.start + 1 }));
						}}
					/>
				)}

				{/* End marker */}
				{measurementPoints.end !== null && (
					<MeasureMarker
						label="B"
						markerKey={`end-${markerKeys.end}-${showLabels}`}
						coordinate={{
							latitude: trailPoints[measurementPoints.end].lat,
							longitude: trailPoints[measurementPoints.end].lng,
						}}
						showLabels={showLabels}
						onDrag={(e) => {
							const nearestIndex = findNearestTrailPoint(
								e.nativeEvent.coordinate.latitude,
								e.nativeEvent.coordinate.longitude
							);
							setMeasurementPoints(prev => ({ ...prev, end: nearestIndex }));
						}}
						onDragEnd={(e) => {
							const nearestIndex = findNearestTrailPoint(
								e.nativeEvent.coordinate.latitude,
								e.nativeEvent.coordinate.longitude
							);
							setMeasurementPoints(prev => ({ ...prev, end: nearestIndex }));
							setMarkerKeys(prev => ({ ...prev, end: prev.end + 1 }));
						}}
					/>
				)}
			</MapView>
			{/* Trail button */}
			<Pressable
				onPress={() => mapRef.current?.animateToRegion(getTrailRegion())}
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
					onPress={toggleMeasureMode}
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
				<View
					style={[styles.measureOverlay, { backgroundColor: colors.surface(0.9) }]}
					onLayout={(e) => setMeasureOverlayBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
				>
					<View style={styles.measureHeader}>
						<View style={styles.measureRow}>
							<MaterialCommunityIcons name="ruler" size={18} color={colors.primary()} />
							<AppText style={styles.measureTitle}>Distance</AppText>
						</View>
						<Pressable
							onPress={measuredDistance === null ? toggleMeasureMode : clearMeasurement}
							style={[styles.clearButton, { backgroundColor: colors.accent() }]}
						>
							<AppText style={{ color: colors.surface() }}>
								{measuredDistance === null ? 'Cancel' : 'Clear'}
							</AppText>
						</Pressable>
					</View>
					<View style={styles.measureRow}>
						{measuredDistance === null ? (
							<>
								<MaterialCommunityIcons name="gesture-tap" size={20} color={colors.primary()} />
								<AppText style={{ flexShrink: 1 }}>
									{measurementPoints.start === null
										? 'Tap the START point'
										: 'Tap the END point'}
								</AppText>
							</>
						) : (
							<>
								<MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.primary()} />
								<AppText style={[styles.distanceText, { flex: 1 }]}>{measuredDistance.toFixed(2)} miles</AppText>
								<Pressable onPress={fitToMeasurement} hitSlop={8} accessibilityLabel="Center on measured segment">
									<Ionicons name="locate" size={24} color={colors.primary()} />
								</Pressable>
							</>
						)}
					</View>
				</View>
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
		padding: 12,
		borderRadius: 12,
		gap: 10,
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
	distanceText: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	clearButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
});
