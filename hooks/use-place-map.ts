import { LIST_SHEET_SNAP } from "@/components/MapSheet/MapListSheet";
import { Poi, PoiCategory } from "@/constants/pois";
import { waypoints } from "@/constants/waypoints";
import { usePois } from "@/contexts/PoisContext";
import { Place } from "@/types/Place";
import { fitMapToCoordinates, isInRegion } from "@/utils/map";
import { areAllCategoriesEnabled, compareByTrailMile, getPoiRouteCoordinates, isSearchQuery, searchPlaces } from "@/utils/pois";
import { getMapDetailLevel } from "@/utils/trail";
import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import MapView, { Region } from "react-native-maps";

const BOTTOM_SHEET_PARTIAL_OPEN_PERCENT = 0.4;
export const PLACE_SHEET_PARTIAL_HEIGHT = `${BOTTOM_SHEET_PARTIAL_OPEN_PERCENT * 100}%`;
const MAX_VISIBLE_POIS = 100;
// Zoom used when selecting a place whose pin isn't shown at the current zoom, such as a search result
const SELECTED_PLACE_DELTA = 0.04;
// Keeps results clustered in one town from zooming in to street level
const MIN_SEARCH_FIT_DELTA = 0.04;
const FIT_MARGIN = 50;

// Keeps fitted coordinates above the partially open sheet
function getSheetFitPadding(mapHeight: number) {
	return {
		top: FIT_MARGIN,
		right: FIT_MARGIN,
		bottom: mapHeight * BOTTOM_SHEET_PARTIAL_OPEN_PERCENT + FIT_MARGIN,
		left: FIT_MARGIN,
	};
}

/**
 * State for a map of trailheads and places with a list sheet and a detail sheet for the selected place
 */
export default function usePlaceMap(enabledCategories: ReadonlySet<PoiCategory>) {
	const { pois, routes } = usePois();
	const mapRef = useRef<MapView>(null);
	const listSheetRef = useRef<BottomSheet>(null);
	const [region, setRegion] = useState<Region | null>(null);
	const [mapHeight, setMapHeight] = useState(0);
	const [selected, setSelected] = useState<Place | null>(null);
	const [query, setQuery] = useState('');

	const detailLevel = getMapDetailLevel(region?.longitudeDelta);
	const { showMarkers, showPois } = detailLevel;

	// Filter waypoints to those visible in the current viewport
	const visibleWaypoints = useMemo(() => {
		if (!region || !showMarkers) return [];
		return waypoints.filter(wp => isInRegion(wp, region));
	}, [region, showMarkers]);

	// POIs of the enabled categories in the viewport, limited to those nearest the center in busy towns.
	// Categories without a chip only appear when every chip is on.
	const visiblePois = useMemo(() => {
		if (!region || !showPois || enabledCategories.size === 0) return [];
		const allCategoriesEnabled = areAllCategoriesEnabled(enabledCategories);
		const inView = pois.filter(poi =>
			(allCategoriesEnabled || enabledCategories.has(poi.category)) && isInRegion(poi, region));
		if (inView.length <= MAX_VISIBLE_POIS) return inView;
		const distanceFromCenter = (poi: Poi) =>
			(poi.lat - region.latitude) ** 2 + (poi.lng - region.longitude) ** 2;
		return inView
			.sort((a, b) => distanceFromCenter(a) - distanceFromCenter(b))
			.slice(0, MAX_VISIBLE_POIS);
	}, [pois, enabledCategories, region, showPois]);

	const selectedWaypoint = selected?.kind === 'trailhead' ? selected.waypoint : null;
	const selectedPoi = selected?.kind === 'poi' ? selected.poi : null;

	const selectedRoute = useMemo(
		() => (selectedPoi ? getPoiRouteCoordinates(selectedPoi, routes) : null),
		[selectedPoi, routes]
	);

	const searching = isSearchQuery(query);
	const searchResults = useMemo(() => (searching ? searchPlaces(query, pois) : []), [searching, query, pois]);

	// While searching, the map shows only the results, whatever the zoom
	const shownPois = useMemo(() => {
		if (!searching) return visiblePois;
		return searchResults.flatMap(place => (place.kind === 'poi' ? [place.poi] : []));
	}, [searching, searchResults, visiblePois]);
	const shownTrailheads = useMemo(() => {
		if (!searching) return showMarkers ? waypoints : [];
		return searchResults.flatMap(place => (place.kind === 'trailhead' ? [place.waypoint] : []));
	}, [searching, searchResults, showMarkers]);

	// The selected place stays on the map even when the search, its category, or the zoom would hide it
	const poiMarkers = selectedPoi && !shownPois.some(poi => poi.id === selectedPoi.id)
		? [...shownPois, selectedPoi]
		: shownPois;
	const trailheadMarkers = selectedWaypoint && !shownTrailheads.includes(selectedWaypoint)
		? [...shownTrailheads, selectedWaypoint]
		: shownTrailheads;

	const listPlaces = useMemo(() => {
		if (searching) return searchResults;
		const places: Place[] = [
			...visibleWaypoints.map(waypoint => ({ kind: 'trailhead' as const, waypoint })),
			...visiblePois.map(poi => ({ kind: 'poi' as const, poi })),
		];
		return places.sort(compareByTrailMile);
	}, [searching, searchResults, visibleWaypoints, visiblePois]);

	let emptyMessage = 'Zoom in to see trailheads';
	if (searching) {
		emptyMessage = 'No places match';
	} else if (enabledCategories.size > 0) {
		emptyMessage = showPois ? 'No trailheads or places here' : 'Zoom in to see trailheads and places';
	}

	// An empty list already says to zoom in
	const showZoomHint = !searching && !showPois && enabledCategories.size > 0 && listPlaces.length > 0;

	// Offset the center so the marker appears in the visible area above the sheet
	const select = useCallback((place: Place) => {
		setSelected(place);
		Keyboard.dismiss();
		listSheetRef.current?.snapToIndex(LIST_SHEET_SNAP.collapsed);

		const placeDetailLevel = getMapDetailLevel(region?.longitudeDelta);
		const pinShown = place.kind === 'poi' ? placeDetailLevel.showPois : placeDetailLevel.showMarkers;
		const keepZoom = region !== null && pinShown;
		const latitudeDelta = keepZoom ? region.latitudeDelta : SELECTED_PLACE_DELTA;
		const longitudeDelta = keepZoom ? region.longitudeDelta : SELECTED_PLACE_DELTA;
		const latOffset = (latitudeDelta * BOTTOM_SHEET_PARTIAL_OPEN_PERCENT) / 2;
		const { lat, lng } = place.kind === 'poi' ? place.poi : place.waypoint;

		// Zoom out to show the whole route when it would extend under the sheet or off screen
		const route = place.kind === 'poi' ? getPoiRouteCoordinates(place.poi, routes) : null;
		const areaAboveSheet = { latitude: lat, longitude: lng, latitudeDelta: latitudeDelta * (1 - BOTTOM_SHEET_PARTIAL_OPEN_PERCENT), longitudeDelta };
		if (route && !route.every(point => isInRegion({ lat: point.latitude, lng: point.longitude }, areaAboveSheet))) {
			fitMapToCoordinates(mapRef.current, route, getSheetFitPadding(mapHeight));
			return;
		}

		mapRef.current?.animateToRegion({
			latitude: lat - latOffset,
			longitude: lng,
			latitudeDelta,
			longitudeDelta,
		}, 500);
	}, [region, routes, mapHeight]);

	const clearSelection = useCallback(() => {
		setSelected(null);
	}, []);

	// Shows the results in the list sheet partially open, with the map framing them all above it
	const fitSearchResults = useCallback(() => {
		if (searchResults.length === 0) return;
		listSheetRef.current?.snapToIndex(LIST_SHEET_SNAP.partial);

		const locations = searchResults.map(place => (place.kind === 'poi' ? place.poi : place.waypoint));
		const lats = locations.map(location => location.lat);
		const lngs = locations.map(location => location.lng);
		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);
		const minLng = Math.min(...lngs);
		const maxLng = Math.max(...lngs);
		const latitude = (minLat + maxLat) / 2;
		const longitude = (minLng + maxLng) / 2;
		const halfLatSpan = Math.max(maxLat - minLat, MIN_SEARCH_FIT_DELTA) / 2;
		const halfLngSpan = Math.max(maxLng - minLng, MIN_SEARCH_FIT_DELTA) / 2;

		fitMapToCoordinates(mapRef.current, [
			{ latitude: latitude - halfLatSpan, longitude: longitude - halfLngSpan },
			{ latitude: latitude + halfLatSpan, longitude: longitude + halfLngSpan },
		], getSheetFitPadding(mapHeight));
	}, [searchResults, mapHeight]);

	return {
		mapRef,
		listSheetRef,
		region,
		setRegion,
		mapHeight,
		setMapHeight,
		detailLevel,
		selected,
		selectedWaypoint,
		selectedPoi,
		selectedRoute,
		select,
		clearSelection,
		query,
		setQuery,
		searching,
		fitSearchResults,
		poiMarkers,
		trailheadMarkers,
		listPlaces,
		emptyMessage,
		showZoomHint,
	};
}
