import type { Waypoint } from "@/constants/waypoints";
import { View } from "react-native";
import LabeledMarker from "./LabeledMarker";
import useColors from "@/hooks/use-colors";

const HIT_SIZE = 44;
const LABEL_WIDTH = 100;

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
	return (
		<LabeledMarker
			coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
			size={expandHitArea ? HIT_SIZE : markerSize}
			pinSize={markerSize}
			label={showLabels ? waypoint.name : undefined}
			labelWidth={LABEL_WIDTH}
			tracksViewChanges={true}
			onPress={onPress}
		>
			<View style={{
				borderWidth: focused ? 3 : 1,
				borderColor: focused ? colors.accent() : colors.onPrimary(),
				backgroundColor: colors.primary(),
				width: markerSize,
				height: markerSize,
				borderRadius: markerSize / 2,
			}} />
		</LabeledMarker>
	);
}
