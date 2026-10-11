import AppText from "@/components/ui/AppText";
import { getTripTypeOption } from "@/constants/tripTypes";
import useColors from "@/hooks/use-colors";
import type { Trip } from "@/types/Trip";
import { formatTripDate, getTripSummary } from "@/utils/trip-util";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";

interface Props {
	trip: Trip;
	/** Offered as an accessibility action, since a swipe to delete can't be performed with VoiceOver */
	onDelete?: () => void;
}

export default function TripListItem({ trip, onDelete }: Props) {
	const colors = useColors();
	const router = useRouter();
	const { icon } = getTripTypeOption(trip.type);
	const { title, miles } = useMemo(() => getTripSummary(trip), [trip]);

	return (
		<Pressable
			onPress={() => router.push({ pathname: '/new-trip/details', params: { id: trip.id } })}
			accessibilityRole="button"
			accessibilityActions={onDelete && [{ name: 'delete', label: 'Delete' }]}
			onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && onDelete?.()}
			style={({ pressed }) => [styles.container, { borderBottomColor: colors.text(0.1), opacity: pressed ? 0.6 : 1 }]}
		>
			<View style={[styles.icon, { backgroundColor: colors.primary(0.15) }]}>
				<MaterialCommunityIcons name={icon} size={22} color={colors.primary()} />
			</View>
			<View style={styles.content}>
				<AppText numberOfLines={1} style={styles.title}>{title}</AppText>
				<AppText style={{ fontSize: 14, color: colors.text(0.6) }}>{formatTripDate(trip)}</AppText>
			</View>
			<View style={styles.distance}>
				<AppText style={styles.miles}>{miles.toFixed(1)} mi</AppText>
				{trip.isRoundTrip && (
					<AppText style={{ fontSize: 12, color: colors.text(0.6) }}>round trip</AppText>
				)}
			</View>
		</Pressable>
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
