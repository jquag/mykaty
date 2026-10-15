import AddStopBar from "@/components/MapSheet/AddStopBar";
import DetailBottomSheet from "@/components/MapSheet/DetailBottomSheet";
import MapListSheet from "@/components/MapSheet/MapListSheet";
import PoiDetail from "@/components/MapSheet/PoiDetail";
import TrailheadDetail from "@/components/MapSheet/TrailheadDetail";
import PoiMarker from "@/components/PoiMarker";
import TrailheadMarker from "@/components/TrailheadMarker";
import TripPointMarker from "@/components/TripPointMarker";
import type { Poi, PoiCategory } from "@/constants/pois";
import { trailPoints } from "@/constants/trailPoints";
import { waypoints } from "@/constants/waypoints";
import { usePois } from "@/contexts/PoisContext";
import useColors from "@/hooks/use-colors";
import usePlaceMap, { PLACE_SHEET_PARTIAL_HEIGHT } from "@/hooks/use-place-map";
import type { StopLeg } from "@/types/Trip";
import { getCategoryConfig } from "@/utils/pois";
import {
	buildTripItinerary,
	findPreviousPoint,
	getLegMiles,
	getLegStops,
	getStopPoint,
	isOnRoute,
	isSameStop,
	parseStops,
	RoutePoint,
	sortLegStops,
	toTripStop,
} from "@/utils/stops";
import { AT_WAYPOINT_MILES, getNearestWaypoint, getSegmentCoordinates, isTrailIndex, trailCoordinates } from "@/utils/trail";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";

// Close enough to show places, which only appear below a longitude span of 0.3
const ADD_STOP_DELTA = 0.12;
const DEFAULT_CATEGORIES: PoiCategory[] = ['food', 'lodging'];

interface PickerProps {
	id?: string;
	start: number;
	end: number;
	leg: StopLeg;
	stopsJson?: string;
}

/** Picks a place to add as a stop on one leg of the trip being edited, then returns it to the details form */
export default function AddStop() {
	const params = useLocalSearchParams<{ id?: string; start?: string; end?: string; leg?: string; stops?: string }>();
	const start = Number(params.start);
	const end = Number(params.end);
	if (!isTrailIndex(start) || !isTrailIndex(end) || start === end) {
		return <Redirect href="/new-trip" />;
	}
	return (
		<StopPicker
			id={params.id}
			start={start}
			end={end}
			leg={params.leg === 'back' ? 'back' : 'out'}
			stopsJson={params.stops}
		/>
	);
}

function describePoint(point: RoutePoint, leg: StopLeg) {
	if (point.stop) return point.stop.name;
	const { waypoint, miles } = getNearestWaypoint(point.trailIndex);
	return `the ${leg === 'out' ? 'start' : 'turnaround'} ${miles <= AT_WAYPOINT_MILES ? 'at' : 'near'} ${waypoint.name}`;
}

function StopPicker({ id, start, end, leg, stopsJson }: PickerProps) {
	const router = useRouter();
	const colors = useColors();
	const { attribution, pois } = usePois();
	const [categories, setCategories] = useState<ReadonlySet<PoiCategory>>(() => new Set(DEFAULT_CATEGORIES));
	const {
		mapRef, listSheetRef, setRegion, setMapHeight, detailLevel,
		selected, selectedPoi, selectedWaypoint, selectedRoute, select, clearSelection,
		query, setQuery, poiMarkers, listPlaces, emptyMessage, showZoomHint,
	} = usePlaceMap(categories);
	const { showLabels, showMarkers } = detailLevel;

	const [from, to] = leg === 'out' ? [start, end] : [end, start];
	const stops = useMemo(() => parseStops(stopsJson), [stopsJson]);
	const legStops = useMemo(() => getLegStops(stops, leg), [stops, leg]);
	const itinerary = useMemo(
		() => buildTripItinerary(start, end, leg === 'back' || stops.some(stop => stop.leg === 'back'), stops),
		[start, end, leg, stops]
	);
	const stopEntries = [...itinerary.out, ...(itinerary.back ?? [])].filter(entry => entry.stop);
	const segmentCoordinates = useMemo(() => getSegmentCoordinates(start, end), [start, end]);

	// Opens on the last stop so far on this leg, or where the leg begins
	const [initialRegion] = useState(() => {
		const sorted = sortLegStops(legStops, from, to);
		const center = sorted[sorted.length - 1]?.stop ?? trailPoints[from];
		return { latitude: center.lat, longitude: center.lng, latitudeDelta: ADD_STOP_DELTA, longitudeDelta: ADD_STOP_DELTA };
	});

	// The numbered stop markers stand in for these places
	const placeMarkers = poiMarkers.filter(poi => !stops.some(stop => stop.poiId === poi.id));

	const selectStopPoi = (poiId: string) => {
		const poi = pois.find(candidate => candidate.id === poiId);
		if (poi) select({ kind: 'poi', poi });
	};

	const renderAddStopBar = (poi: Poi) => {
		const candidate = toTripStop(poi, leg);
		const previous = findPreviousPoint(from, to, legStops, candidate);
		const miles = getLegMiles(previous, getStopPoint(candidate));
		let disabledReason: string | undefined;
		if (legStops.some(stop => isSameStop(stop, candidate))) {
			disabledReason = 'Already a stop';
		} else if (!isOnRoute(poi.trailIndex, start, end)) {
			disabledReason = 'Not along this trip';
		}
		return (
			<AddStopBar
				distance={`${miles.toFixed(1)} mi from ${describePoint(previous, leg)}`}
				disabledReason={disabledReason}
				onAdd={() => router.dismissTo({
					pathname: '/new-trip/details',
					params: { start, end, ...(id && { id }), addStop: JSON.stringify(candidate) },
				})}
			/>
		);
	};

	return (
		<View style={{ flex: 1 }}>
			<Stack.Screen options={{ title: leg === 'back' ? 'Add Return Stop' : 'Add Stop' }} />
			<MapView
				ref={mapRef}
				provider={PROVIDER_DEFAULT}
				initialRegion={initialRegion}
				onRegionChangeComplete={setRegion}
				onLayout={(e) => setMapHeight(e.nativeEvent.layout.height)}
				rotateEnabled={false}
				style={{ flex: 1, width: '100%' }}
			>
				<Polyline
					coordinates={trailCoordinates}
					strokeColor={colors.accent(0.4)}
					strokeWidth={4}
				/>
				<Polyline
					coordinates={segmentCoordinates}
					strokeColor={colors.primary()}
					strokeWidth={6}
					zIndex={1}
				/>

				{selectedPoi && selectedRoute && (
					<Polyline
						coordinates={selectedRoute}
						strokeColor={getCategoryConfig(selectedPoi.category).color}
						strokeWidth={5}
						zIndex={2}
					/>
				)}

				{placeMarkers.map(poi => (
					<PoiMarker key={poi.id} poi={poi} focused={selectedPoi?.id === poi.id} onPress={() => select({ kind: 'poi', poi })} />
				))}

				{showMarkers ? waypoints.map((waypoint, index) => (
					<TrailheadMarker
						key={index}
						waypoint={waypoint}
						showLabels={showLabels || selectedWaypoint === waypoint}
						focused={selectedWaypoint === waypoint}
						onPress={() => select({ kind: 'trailhead', waypoint })}
					/>
				)) : null}

				<TripPointMarker coordinate={trailCoordinates[start]} label="A" color={colors.primary()} textColor={colors.border()} />
				<TripPointMarker coordinate={trailCoordinates[end]} label="B" color={colors.primary()} textColor={colors.border()} />
				{stopEntries.map(({ stop, number }) => stop && (
					<TripPointMarker
						key={`${stop.leg}-${stop.poiId}`}
						coordinate={{ latitude: stop.lat, longitude: stop.lng }}
						label={String(number)}
						color={getCategoryConfig(stop.category).color}
						hollow={stop.leg === 'back'}
						onPress={() => selectStopPoi(stop.poiId)}
					/>
				))}
			</MapView>

			<MapListSheet
				ref={listSheetRef}
				places={selected ? [] : listPlaces}
				emptyMessage={emptyMessage}
				showZoomHint={showZoomHint}
				query={query}
				onQueryChange={setQuery}
				enabledCategories={categories}
				onCategoriesChange={(enabled) => setCategories(new Set(enabled))}
				partialOpenHeight={PLACE_SHEET_PARTIAL_HEIGHT}
				onPlaceSelected={select}
			/>
			{selected && (
				<DetailBottomSheet
					partialOpenHeight={PLACE_SHEET_PARTIAL_HEIGHT}
					onClose={clearSelection}
				>
					{selected.kind === 'poi'
						? <PoiDetail poi={selected.poi} attribution={attribution} accessory={renderAddStopBar(selected.poi)} />
						: <TrailheadDetail waypoint={selected.waypoint} />}
				</DetailBottomSheet>
			)}
		</View>
	);
}
