import MeasureMarker from "@/components/MeasureMarker";
import TrailheadMarker from "@/components/TrailheadMarker";
import TrailheadBottomSheet from "@/components/TrailheadBottomSheet/TrailheadBottomSheet";
import AppText from "@/components/ui/AppText";
import { trailPoints } from "@/constants/trailPoints";
import { Waypoint, waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import { getTrailRegion } from "@/utils/trail";
import { calculateTrailDistance } from "@/utils/map";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { MapPressEvent, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';

const BOTTOM_SHEET_PARTIAL_OPEN_PERCENT = 0.4;

export default function Index() {
	const mapRef = useRef<MapView>(null);
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
					<TrailheadMarker key={index} waypoint={waypoint} showLabels={showLabels || selectedPoi === waypoint} focused={selectedPoi === waypoint} onPress={() => handlePoiSelected(waypoint)} />
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
				<AppText>Trail</AppText>
			</Pressable>

			{/* Distance button */}
			<Pressable
				onPress={toggleMeasureMode}
				style={{
					position: 'absolute',
					top: 60,
					right: 16,
					backgroundColor: measureMode ? colors.accent(0.9) : colors.surface(.7),
					borderRadius: 8,
					padding: 8,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 6,
				}}
			>
				<MaterialCommunityIcons
					name="ruler"
					size={18}
					color={measureMode ? colors.surface() : colors.text()}
				/>
				<AppText style={{ color: measureMode ? colors.surface() : colors.text() }}>
					{measureMode ? 'Cancel' : 'Distance'}
				</AppText>
			</Pressable>

			{/* Instructions overlay */}
			{measureMode && measuredDistance === null && (
				<View style={[styles.instructionsOverlay, { backgroundColor: colors.surface(0.9) }]}>
					<MaterialCommunityIcons name="gesture-tap" size={20} color={colors.primary()} />
					<AppText style={{ marginLeft: 8 }}>
						{measurementPoints.start === null
							? 'Tap the START point on the trail'
							: 'Tap the END point on the trail'}
					</AppText>
				</View>
			)}

			{/* Distance display */}
			{measuredDistance !== null && (
				<View style={[styles.distanceDisplay, { backgroundColor: colors.surface(0.95) }]}>
					<View style={styles.distanceRow}>
						<MaterialCommunityIcons name="map-marker-distance" size={24} color={colors.primary()} />
						<AppText style={styles.distanceText}>{measuredDistance.toFixed(2)} miles</AppText>
					</View>
					<Pressable
						onPress={clearMeasurement}
						style={[styles.clearButton, { backgroundColor: colors.accent() }]}
					>
						<AppText style={{ color: colors.surface() }}>Clear</AppText>
					</Pressable>
				</View>
			)}

			<TrailheadBottomSheet
				waypoints={visibleWaypoints}
				selectedPoi={selectedPoi}
				partialOpenHeight={BOTTOM_SHEET_PARTIAL_OPEN_PERCENT * 100 + '%'}
				onPoiSelected={handlePoiSelected}
				onClearPoiSelection={handleClearPoiSelection}
			/>
    </View>
  );
}

const styles = StyleSheet.create({
	instructionsOverlay: {
		position: 'absolute',
		bottom: 30,
		left: 16,
		right: 16,
		padding: 12,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	distanceDisplay: {
		position: 'absolute',
		bottom: 30,
		left: 16,
		right: 16,
		padding: 16,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	distanceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	distanceText: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	clearButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
	},
});
