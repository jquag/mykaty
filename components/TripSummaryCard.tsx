import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { describeTrailPoint, getTrailMiles } from "@/utils/trail";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

interface Props {
	startIndex: number;
	endIndex: number;
	isRoundTrip: boolean;
}

export default function TripSummaryCard({ startIndex, endIndex, isRoundTrip }: Props) {
	const colors = useColors();
	const oneWayMiles = getTrailMiles(startIndex, endIndex);

	return (
		<View style={[styles.card, { backgroundColor: colors.primary(0.1), borderColor: colors.primary(0.3) }]}>
			<View style={styles.row}>
				<AppText style={styles.place}>{describeTrailPoint(startIndex)}</AppText>
				<MaterialCommunityIcons
					name={isRoundTrip ? 'swap-horizontal' : 'arrow-right'}
					size={20}
					color={colors.primary()}
				/>
				<AppText style={styles.place}>{describeTrailPoint(endIndex)}</AppText>
			</View>
			<View style={styles.row}>
				<MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.primary()} />
				<AppText>
					{isRoundTrip
						? `${(oneWayMiles * 2).toFixed(1)} mi round trip (${oneWayMiles.toFixed(1)} mi each way)`
						: `${oneWayMiles.toFixed(1)} mi`}
				</AppText>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
		gap: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: 8,
	},
	place: {
		fontSize: 18,
		fontWeight: 'bold',
		flexShrink: 1,
	},
});
