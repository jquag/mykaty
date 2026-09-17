import AppText from "@/components/ui/AppText";
import { TRIP_TYPES } from "@/constants/tripTypes";
import useColors from "@/hooks/use-colors";
import type { Trip } from "@/types/Trip";
import { formatTripDate, getTripMiles, getTripTitle } from "@/utils/trip-util";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

interface Props {
	trip: Trip;
}

export default function TripListItem({ trip }: Props) {
	const colors = useColors();
	const icon = TRIP_TYPES.find(option => option.value === trip.type)?.icon ?? 'bike';

	return (
		<View style={[styles.container, { borderBottomColor: colors.text(0.1) }]}>
			<View style={[styles.icon, { backgroundColor: colors.primary(0.15) }]}>
				<MaterialCommunityIcons name={icon} size={22} color={colors.primary()} />
			</View>
			<View style={styles.content}>
				<AppText numberOfLines={1} style={styles.title}>{getTripTitle(trip)}</AppText>
				<AppText style={{ fontSize: 14, color: colors.text(0.6) }}>{formatTripDate(trip)}</AppText>
			</View>
			<View style={styles.distance}>
				<AppText style={styles.miles}>{getTripMiles(trip).toFixed(1)} mi</AppText>
				{trip.isRoundTrip && (
					<AppText style={{ fontSize: 12, color: colors.text(0.6) }}>round trip</AppText>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	icon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		gap: 2,
	},
	title: {
		fontSize: 17,
		fontWeight: '600',
	},
	distance: {
		alignItems: 'flex-end',
	},
	miles: {
		fontWeight: '700',
	},
});
