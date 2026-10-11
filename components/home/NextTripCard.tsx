import AppText from "@/components/ui/AppText";
import { getTripTypeOption } from "@/constants/tripTypes";
import useColors from "@/hooks/use-colors";
import type { Trip } from "@/types/Trip";
import { daysBetween, describeDaysUntil, formatTripDate, getTripSummary, toDateString } from "@/utils/trip-util";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
	trip: Trip;
	now: Date;
}

export default function NextTripCard({ trip, now }: Props) {
	const colors = useColors();
	const router = useRouter();
	const { title, miles } = getTripSummary(trip);
	const { icon } = getTripTypeOption(trip.type);
	const when = describeDaysUntil(daysBetween(toDateString(now), trip.date));

	return (
		<Pressable
			onPress={() => router.push({ pathname: '/new-trip/details', params: { id: trip.id } })}
			accessibilityRole="button"
			style={({ pressed }) => [
				styles.card,
				{ backgroundColor: colors.primary(0.1), borderColor: colors.primary(0.3), opacity: pressed ? 0.6 : 1 },
			]}
		>
			<AppText style={[styles.label, { color: colors.primary() }]}>{`Next trip · ${when}`}</AppText>
			<AppText style={styles.title} numberOfLines={2}>{title}</AppText>
			<View style={styles.row}>
				<MaterialCommunityIcons name={icon} size={18} color={colors.primary()} />
				<AppText style={[styles.detail, { color: colors.text(0.7) }]}>
					{`${formatTripDate(trip)} · ${miles.toFixed(1)} mi${trip.isRoundTrip ? ' round trip' : ''}`}
				</AppText>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
		gap: 4,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 2,
	},
	detail: {
		fontSize: 14,
		flexShrink: 1,
	},
});
