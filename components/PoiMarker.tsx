import { Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColorScheme, View } from "react-native";
import { useEffect, useState } from "react";
import type { Poi } from "@/constants/pois";
import { getCategoryConfig } from "@/utils/pois";
import AppText from "./ui/AppText";
import useColors from "@/hooks/use-colors";

const MARKER_SIZE = 20;
const FOCUSED_MARKER_SIZE = 30;
const HIT_SIZE = 32;
const LABEL_WIDTH = 140;
const LABEL_HEIGHT = 20;
const LABEL_GAP = 2;
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

	// The dot sits at the exact center of the view so it lands on the coordinate;
	// the label below it is balanced by equal empty space above.
	const width = focused ? LABEL_WIDTH : HIT_SIZE;
	const height = focused ? markerSize + 2 * (LABEL_GAP + LABEL_HEIGHT) : HIT_SIZE;

	return (
		<Marker
			// Remount when the view's size changes; iOS doesn't resize an already-mounted marker
			key={`${poi.id}-${focused}`}
			coordinate={{ latitude: poi.lat, longitude: poi.lng }}
			anchor={{ x: 0.5, y: 0.5 }}
			tracksViewChanges={settledKey !== renderKey}
			zIndex={focused ? 1 : undefined}
			onPress={onPress}
		>
			{/* collapsable={false}: the marker sizes itself from its first native child, so this view must not be flattened */}
			<View collapsable={false} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
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
				{focused && (
					<View style={{
						position: 'absolute',
						top: height / 2 + markerSize / 2 + LABEL_GAP,
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
							{poi.name}
						</AppText>
					</View>
				)}
			</View>
		</Marker>
	);
}
