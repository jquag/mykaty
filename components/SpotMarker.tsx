import type { MapSpot } from "@/hooks/use-place-map";
import useColors from "@/hooks/use-colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import LabeledMarker from "./LabeledMarker";

const PIN_SIZE = 26;
const HIT_SIZE = 32;
const LABEL_WIDTH = 140;

interface Props {
	spot: MapSpot;
}

/** A lightbulb tile like the fun fact card's, so it doesn't read as a trailhead or place */
export default function SpotMarker({ spot }: Props) {
	const colors = useColors();
	return (
		<LabeledMarker
			coordinate={{ latitude: spot.lat, longitude: spot.lng }}
			size={HIT_SIZE}
			pinSize={PIN_SIZE}
			label={spot.label}
			labelWidth={LABEL_WIDTH}
			zIndex={2}
			tracksViewChanges={true}
		>
			<View style={{
				width: PIN_SIZE,
				height: PIN_SIZE,
				borderRadius: 7,
				borderWidth: 2,
				borderColor: colors.white(),
				backgroundColor: colors.secondary(),
				alignItems: 'center',
				justifyContent: 'center',
			}}>
				<MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={colors.white()} />
			</View>
		</LabeledMarker>
	);
}
