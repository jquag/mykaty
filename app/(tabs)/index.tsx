import FeaturedTrailheadCard from "@/components/home/FeaturedTrailheadCard";
import NextTripCard from "@/components/home/NextTripCard";
import NoticeCard from "@/components/home/NoticeCard";
import ProgressCard from "@/components/home/ProgressCard";
import TripListItem from "@/components/TripListItem";
import AppText from "@/components/ui/AppText";
import { useTrips } from "@/contexts/TripsContext";
import useColors from "@/hooks/use-colors";
import useNow from "@/hooks/use-now";
import { getWinterClosureNotice } from "@/utils/season";
import { splitTrips } from "@/utils/trip-util";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const RECENT_COUNT = 3;

export default function Home() {
	const colors = useColors();
	const router = useRouter();
	const now = useNow();
	const { trips, loading, loadFailed, reload } = useTrips();

	if (loading) {
		return <View style={{ flex: 1, backgroundColor: colors.surface() }} />;
	}

	const { completed, upcoming } = splitTrips(trips, now);
	const nextTrip = upcoming[0];
	const closureNotice = getWinterClosureNotice(now, nextTrip?.date);

	return (
		<ScrollView style={{ backgroundColor: colors.surface() }} contentContainerStyle={styles.content}>
			{nextTrip && <NextTripCard trip={nextTrip} now={now} />}
			{closureNotice && <NoticeCard icon="snowflake" message={closureNotice} />}
			{loadFailed ? (
				<View style={[styles.failed, { borderColor: colors.text(0.1) }]}>
					<AppText style={{ color: colors.text(0.6) }}>{"Couldn't load your trips"}</AppText>
					<Pressable onPress={reload} hitSlop={8}>
						<AppText style={[styles.link, { color: colors.primary() }]}>Try again</AppText>
					</Pressable>
				</View>
			) : (
				<ProgressCard completed={completed} upcoming={upcoming} />
			)}
			<FeaturedTrailheadCard now={now} />
			{completed.length > 0 && (
				<View>
					<View style={styles.sectionHeader}>
						<AppText style={[styles.sectionTitle, { color: colors.text(0.6) }]}>Recent</AppText>
						<Pressable onPress={() => router.navigate('/trips')} hitSlop={8}>
							<AppText style={[styles.link, { color: colors.primary() }]}>See all</AppText>
						</Pressable>
					</View>
					{completed.slice(0, RECENT_COUNT).map(trip => <TripListItem key={trip.id} trip={trip} />)}
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 16,
		gap: 16,
	},
	failed: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	link: {
		fontSize: 15,
		fontWeight: '700',
	},
});
