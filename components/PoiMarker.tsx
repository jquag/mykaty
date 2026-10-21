import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColorScheme, View } from "react-native";
import { useEffect, useState } from "react";
import type { Poi } from "@/constants/pois";
import { getCategoryConfig } from "@/utils/pois";
import LabeledMarker from "./LabeledMarker";
import useColors from "@/hooks/use-colors";

const MARKER_SIZE = 20;
const FOCUSED_MARKER_SIZE = 30;
const HIT_SIZE = 32;
const LABEL_WIDTH = 140;
// Long enough for the icon font to draw before the marker's snapshot is frozen
const RENDER_SETTLE_MS = 500;

interface Props {
	poi: Poi;
	focused?: boolean;
	onPress?: () => void;
}

export default function PoiMarker({ poi, focused = false, onPress }: Props) {
	const colors = useColors();
	const colorScheme = useColorScheme();
	const category = getCategoryConfig(poi.category);
	const markerSize = focused ? FOCUSED_MARKER_SIZE : MARKER_SIZE;

	// Redrawing hundreds of markers on every frame is slow, so each one only tracks changes briefly after its content changes
	const renderKey = `${focused}-${colorScheme}`;
	const [settledKey, setSettledKey] = useState<string | null>(null);
	useEffect(() => {
		const timeout = setTimeout(() => setSettledKey(renderKey), RENDER_SETTLE_MS);
		return () => clearTimeout(timeout);
	}, [renderKey]);

	return (
		<LabeledMarker
			coordinate={{ latitude: poi.lat, longitude: poi.lng }}
			size={HIT_SIZE}
			pinSize={markerSize}
			label={focused ? poi.name : undefined}
			labelWidth={LABEL_WIDTH}
			zIndex={focused ? 1 : undefined}
			tracksViewChanges={settledKey !== renderKey}
			onPress={onPress}
		>
			<View style={{
				width: markerSize,
				height: markerSize,
				borderRadius: markerSize / 2,
				borderWidth: focused ? 3 : 1.5,
				borderColor: focused ? colors.accent() : colors.white(),
				backgroundColor: category.color,
				alignItems: 'center',
				justifyContent: 'center',
			}}>
				<MaterialCommunityIcons name={category.icon} size={markerSize * 0.55} color={colors.white()} />
			</View>
		</LabeledMarker>
	);
}
