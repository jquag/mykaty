import SegmentStatusCard from "@/components/SegmentStatusCard";
import TrailheadMarker from "@/components/TrailheadMarker";
import TrailSegmentLayer from "@/components/TrailSegmentLayer";
import AppText from "@/components/ui/AppText";
import HeaderButton from "@/components/ui/HeaderButton";
import { waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import useTrailSegment from "@/hooks/use-trail-segment";
import { headerButtons } from "@/utils/header";
import { fitMapToCoordinates } from "@/utils/map";
import { getMapDetailLevel, getSegmentCoordinates, getTrailRegion, isTrailIndex, TRAIL_REGION, trailCoordinates } from "@/utils/trail";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";

const FIT_MARGIN = 40;

function parseRoute(start?: string, end?: string) {
	const startIndex = Number(start);
	const endIndex = Number(end);
	if (!isTrailIndex(startIndex) || !isTrailIndex(endIndex) || startIndex === endIndex) return undefined;
	return { start: startIndex, end: endIndex };
}

export default function ChooseRoute() {
	const router = useRouter();
	const navigation = useNavigation();
	const colors = useColors();
	const mapRef = useRef<MapView>(null);
	const params = useLocalSearchParams<{ id?: string; start?: string; end?: string; type?: string }>();
	const [initialRoute] = useState(() => parseRoute(params.start, params.end));
	const segment = useTrailSegment(initialRoute);
	const [longitudeDelta, setLongitudeDelta] = useState<number>();
	const [cardBottom, setCardBottom] = useState(0);
	// A prefilled route is fitted once both the map and the card above it have laid out
	const pendingFit = useRef({ mapReady: false, cardBottom: null as number | null, done: !initialRoute });

	const { showLabels, showMarkers } = getMapDetailLevel(longitudeDelta);
	// Pushed from the details form to change its route, rather than starting a new trip
	const isChangingRoute = (navigation.getState()?.index ?? 0) > 0;

	const fitToSegment = (top = cardBottom) => {
		if (segment.start === null || segment.end === null) return;
		fitMapToCoordinates(mapRef.current, getSegmentCoordinates(segment.start, segment.end), {
			top: top + FIT_MARGIN,
			right: FIT_MARGIN,
			bottom: FIT_MARGIN,
			left: FIT_MARGIN,
		});
	};

	const fitInitialRoute = () => {
		const pending = pendingFit.current;
		if (pending.done || !pending.mapReady || pending.cardBottom === null) return;
		pending.done = true;
		fitToSegment(pending.cardBottom);
	};

	const goToDetails = () => {
		if (segment.start === null || segment.end === null) return;
		router.push({
			pathname: '/new-trip/details',
			params: { start: segment.start, end: segment.end, ...(params.type && { type: params.type }) },
		});
	};

	const applyRoute = () => {
		if (segment.start === null || segment.end === null) return;
		router.dismissTo({
			pathname: '/new-trip/details',
			params: { start: segment.start, end: segment.end, ...(params.id && { id: params.id }) },
		});
	};

	return (
		<View style={{ flex: 1 }}>
			<Stack.Screen
				options={headerButtons({
					left: <HeaderButton title="Cancel" onPress={() => router.back()} />,
					right: (
						<HeaderButton
							title={isChangingRoute ? 'Done' : 'Next'}
							emphasized
							disabled={!segment.isComplete}
							onPress={isChangingRoute ? applyRoute : goToDetails}
						/>
					),
				})}
			/>
			<MapView
				ref={mapRef}
				provider={PROVIDER_DEFAULT}
				initialRegion={initialRoute ? getTrailRegion(initialRoute.start, initialRoute.end) : TRAIL_REGION}
				onMapReady={() => {
					pendingFit.current.mapReady = true;
					fitInitialRoute();
				}}
				onRegionChangeComplete={(region) => setLongitudeDelta(region.longitudeDelta)}
				onPress={(e) => segment.selectAt(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
				rotateEnabled={false}
				style={{ flex: 1, width: '100%' }}
			>
				<Polyline
					coordinates={trailCoordinates}
					strokeColor={colors.accent()}
					strokeWidth={4}
				/>

				<TrailSegmentLayer segment={segment} showLabels={showLabels} />

				{showMarkers && showLabels ? waypoints.map((waypoint, index) => (
					<TrailheadMarker key={index} waypoint={waypoint} showLabels expandHitArea={false} />
				)) : null}
			</MapView>

			<SegmentStatusCard
				segment={segment}
				onFit={() => fitToSegment()}
				style={styles.card}
				onLayout={(e) => {
					const bottom = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
					setCardBottom(bottom);
					pendingFit.current.cardBottom = bottom;
					fitInitialRoute();
				}}
				header={
					<View style={styles.cardHeader}>
						<View style={styles.cardTitle}>
							<MaterialCommunityIcons name="map-marker-path" size={18} color={colors.primary()} />
							<AppText style={{ fontWeight: 'bold' }}>Route</AppText>
						</View>
						{segment.start !== null && (
							<Pressable
								onPress={segment.clear}
								style={[styles.clearButton, { backgroundColor: colors.accent() }]}
							>
								<AppText style={{ color: colors.surface() }}>Clear</AppText>
							</Pressable>
						)}
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		position: 'absolute',
		top: 20,
		left: 16,
		right: 16,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 32,
	},
	cardTitle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	clearButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
});
