import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { useEffect, useState } from "react";
import { useColorScheme, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";

const SIZE = 26;
// Long enough for the label to draw before the marker's snapshot is frozen
const RENDER_SETTLE_MS = 500;

interface Props {
	coordinate: LatLng;
	label: string;
	color: string;
	/** Defaults to white */
	textColor?: string;
	/** Outlined rather than filled, for stops on the way back */
	hollow?: boolean;
	onPress?: () => void;
}

/** A trip's start, end or numbered stop */
export default function TripPointMarker({ coordinate, label, color, textColor, hollow = false, onPress }: Props) {
	const colors = useColors();
	const colorScheme = useColorScheme();

	const labelColor = hollow ? color : textColor ?? colors.white();
	const renderKey = `${label}-${color}-${labelColor}-${hollow}-${colorScheme}`;
	const [settledKey, setSettledKey] = useState<string | null>(null);
	useEffect(() => {
		const timeout = setTimeout(() => setSettledKey(renderKey), RENDER_SETTLE_MS);
		return () => clearTimeout(timeout);
	}, [renderKey]);

	return (
		<Marker
			coordinate={coordinate}
			anchor={{ x: 0.5, y: 0.5 }}
			tracksViewChanges={settledKey !== renderKey}
			zIndex={2}
			onPress={onPress}
		>
			{/* collapsable={false}: the marker sizes itself from its first native child, so this view must not be flattened */}
			<View
				collapsable={false}
				style={{
					width: SIZE,
					height: SIZE,
					borderRadius: SIZE / 2,
					borderWidth: 2,
					borderColor: hollow ? color : colors.white(),
					backgroundColor: hollow ? colors.surface() : color,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<AppText style={{ fontSize: 13, fontWeight: '700', color: labelColor }}>
					{label}
				</AppText>
			</View>
		</Marker>
	);
}
