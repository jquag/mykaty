import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { Marker, MarkerDragStartEndEvent } from "react-native-maps";
import { View, StyleSheet } from "react-native";
import { useState } from "react";

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
	const [dragging, setDragging] = useState(false);

	return (
		<Marker
			key={markerKey}
			coordinate={coordinate}
			draggable
			isPreselected
			zIndex={100}
			onDragStart={() => setDragging(true)}
			onDrag={onDrag}
			onDragEnd={(e) => {
				setDragging(false);
				onDragEnd(e);
			}}
			anchor={{ x: 0.5, y: 0.5 }}
		>
			{/* collapsable={false}: the marker sizes itself from its first native child, so this view must not be flattened */}
			<View collapsable={false} style={styles.hitArea}>
				{/* Scale rather than resize while dragging: a size change would require remounting the marker mid-drag */}
				<View
					style={[
						showLabels ? styles.marker : styles.markerSmall,
						{ backgroundColor: colors.primary(), borderColor: colors.border() },
						dragging && styles.dragging,
					]}
				>
					{showLabels && (
						<AppText style={[styles.markerText, { color: colors.border() }]}>
							{label}
						</AppText>
					)}
				</View>
			</View>
		</Marker>
	);
}

const styles = StyleSheet.create({
	hitArea: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	marker: {
		width: 42,
		height: 42,
		borderRadius: 21,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 4.5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
	},
	markerSmall: {
		width: 18,
		height: 18,
		borderRadius: 9,
		borderWidth: 3,
	},
	dragging: {
		opacity: 0.7,
		transform: [{ scale: 1.5 }],
	},
	markerText: {
		fontSize: 21,
		fontWeight: "bold",
	},
});
