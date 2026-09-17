import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import type { TrailSegment } from "@/hooks/use-trail-segment";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Pressable } from "react-native-gesture-handler";

interface Props {
	segment: TrailSegment;
	onFit: () => void;
	header?: ReactNode;
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
	onLayout?: (e: LayoutChangeEvent) => void;
}

export default function SegmentStatusCard({ segment, onFit, header, children, style, onLayout }: Props) {
	const colors = useColors();

	return (
		<View style={[styles.card, { backgroundColor: colors.surface(0.9) }, style]} onLayout={onLayout}>
			{header}
			<View style={styles.row}>
				{segment.distance === null ? (
					<>
						<MaterialCommunityIcons name="gesture-tap" size={20} color={colors.primary()} />
						<AppText style={{ flexShrink: 1 }}>
							{segment.start === null ? 'Tap the START point' : 'Tap the END point'}
						</AppText>
					</>
				) : (
					<>
						<MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.primary()} />
						<AppText style={styles.distanceText}>{segment.distance.toFixed(2)} miles</AppText>
						<Pressable onPress={onFit} hitSlop={8} accessibilityLabel="Center on selected segment">
							<Ionicons name="locate" size={24} color={colors.primary()} />
						</Pressable>
					</>
				)}
			</View>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 12,
		borderRadius: 12,
		gap: 10,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexShrink: 1,
	},
	distanceText: {
		flex: 1,
		fontSize: 20,
		fontWeight: 'bold',
	},
});
