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
	// The dot sits at the exact center of the view so it lands on the coordinate;
	// the label below it is balanced by equal empty space above.
	let width = markerSize;
	let height = markerSize;
	if (expandHitArea) {
		width = showLabels ? LABEL_WIDTH : HIT_SIZE;
		height = showLabels
			? Math.max(HIT_SIZE, markerSize + 2 * (LABEL_GAP + LABEL_HEIGHT))
			: HIT_SIZE;
	}
	return (
		<Marker
			// Remount when the view's size changes; iOS doesn't resize an already-mounted marker
			key={`${waypoint.lat}-${waypoint.lng}-${focused}-${showLabels}-${expandHitArea}`}
			coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
			anchor={{ x: 0.5, y: 0.5 }}
			tracksViewChanges={true}
			onPress={onPress}
		>
			{/* collapsable={false}: the marker sizes itself from its first native child, so this view must not be flattened */}
			<View collapsable={false} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
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
						top: height / 2 + markerSize / 2 + LABEL_GAP,
						left: (width - LABEL_WIDTH) / 2,
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
