import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { Marker, MarkerDragStartEndEvent } from "react-native-maps";
import { View, StyleSheet } from "react-native";

interface MeasureMarkerProps {
	label: string;
	coordinate: { latitude: number; longitude: number };
	markerKey: string;
	showLabels: boolean;
	onDrag: (e: MarkerDragStartEndEvent) => void;
	onDragEnd: (e: MarkerDragStartEndEvent) => void;
}

export default function MeasureMarker({
	label,
	coordinate,
	markerKey,
	showLabels,
	onDrag,
	onDragEnd,
}: MeasureMarkerProps) {
	const colors = useColors();

	return (
		<Marker
			key={markerKey}
			coordinate={coordinate}
			draggable
			zIndex={100}
			onDrag={onDrag}
			onDragEnd={onDragEnd}
			anchor={{ x: 0.5, y: 0.5 }}
		>
			<View
				style={[
					showLabels ? styles.marker : styles.markerSmall,
					{ backgroundColor: colors.primary(), borderColor: colors.border() },
				]}
			>
				{showLabels && (
					<AppText style={[styles.markerText, { color: colors.border() }]}>
						{label}
					</AppText>
				)}
			</View>
		</Marker>
	);
}

const styles = StyleSheet.create({
	marker: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 2,
	},
	markerSmall: {
		width: 12,
		height: 12,
		borderRadius: 6,
		borderWidth: 2,
	},
	markerText: {
		fontSize: 14,
		fontWeight: "bold",
	},
});
