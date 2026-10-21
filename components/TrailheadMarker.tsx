import { Marker } from "react-native-maps";
import type { Waypoint } from "@/constants/waypoints";
import { View } from "react-native";
import AppText from "./ui/AppText";
import useColors from "@/hooks/use-colors";

const HIT_SIZE = 44;
const LABEL_WIDTH = 100;
const LABEL_HEIGHT = 20;
const LABEL_GAP = 2;

interface Props {
	waypoint: Waypoint;
	showLabels?: boolean;
	focused?: boolean;
	expandHitArea?: boolean;
	onPress?: () => void;
}

export default function TrailheadMarker({ waypoint, showLabels = true, focused = false, expandHitArea = true, onPress }: Props) {
	const colors = useColors();
	const markerSize = focused ? 24 : 14;
	// The dot sits at the exact center of the view so it lands on the coordinate.
	// The label hangs outside the view so only the area around the dot takes taps;
	// a label-sized view would cover the dots of nearby trailheads.
	const size = expandHitArea ? HIT_SIZE : markerSize;
	return (
		<Marker
			// Remount when the view's size changes; iOS doesn't resize an already-mounted marker
			key={`${waypoint.lat}-${waypoint.lng}-${focused}-${expandHitArea}`}
			coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
			anchor={{ x: 0.5, y: 0.5 }}
			tracksViewChanges={true}
			onPress={onPress}
		>
			{/* collapsable={false}: the marker sizes itself from its first native child, so this view must not be flattened */}
			<View collapsable={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
				<View style={{
					borderWidth: focused ? 3 : 1,
					borderColor: focused ? colors.accent() : colors.border(),
					backgroundColor: colors.primary(),
					width: markerSize,
					height: markerSize,
					borderRadius: markerSize / 2,
				}} />
				{showLabels && (
					<View style={{
						position: 'absolute',
						top: size / 2 + markerSize / 2 + LABEL_GAP,
						left: (size - LABEL_WIDTH) / 2,
						width: LABEL_WIDTH,
						height: LABEL_HEIGHT,
						alignItems: 'center',
					}}>
						<AppText numberOfLines={1} style={{
								fontSize: 11,
								fontWeight: '600',
								paddingHorizontal: 4,
								paddingVertical: 2,
								borderRadius: 4,
								overflow: 'hidden',
								backgroundColor: colors.surface(.8),
							}}>
							{waypoint.name}
						</AppText>
					</View>
				)}
			</View>
		</Marker>
	);
}
