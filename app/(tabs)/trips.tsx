import TripListItem from "@/components/TripListItem";
import AppText from "@/components/ui/AppText";
import SwipeToDelete from "@/components/ui/SwipeToDelete";
import { useTrips } from "@/contexts/TripsContext";
import useColors from "@/hooks/use-colors";
import type { Trip } from "@/types/Trip";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";

export default function Trips() {
	const colors = useColors();
	const router = useRouter();
	const { trips, loading, loadFailed, reload, deleteTrip } = useTrips();
	const openRow = useRef<SwipeableMethods | null>(null);

	const handleRowOpen = (row: SwipeableMethods) => {
		if (openRow.current !== row) openRow.current?.close();
		openRow.current = row;
	};

	const handleDelete = (trip: Trip) => {
		deleteTrip(trip.id).catch((error) => {
			console.error('Error deleting trip:', error);
			Alert.alert('Could not delete trip', 'Please try again.');
		});
	};

	if (loading) {
		return <View style={{ flex: 1, backgroundColor: colors.surface() }} />;
	}

	if (loadFailed) {
		return (
			<View style={[styles.empty, { backgroundColor: colors.surface() }]}>
				<MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.accent()} />
				<AppText style={styles.emptyTitle}>{"Couldn't load your trips"}</AppText>
				<AppText style={{ color: colors.text(0.6), textAlign: 'center' }}>
					Your saved trips are still on this device. Try again in a moment.
				</AppText>
				<Pressable
					onPress={reload}
					style={[styles.emptyButton, { backgroundColor: colors.primary() }]}
				>
					<AppText style={{ color: colors.surface(), fontWeight: '700' }}>Try again</AppText>
				</Pressable>
			</View>
		);
	}

	return (
		<Animated.FlatList
			style={{ backgroundColor: colors.surface() }}
			contentContainerStyle={{ flexGrow: 1 }}
			data={trips}
			keyExtractor={(trip) => trip.id}
			itemLayoutAnimation={LinearTransition}
			onScrollBeginDrag={() => openRow.current?.close()}
			renderItem={({ item }) => (
				<Animated.View exiting={FadeOut}>
					<SwipeToDelete onDelete={() => handleDelete(item)} onOpen={handleRowOpen}>
						<View style={styles.row}>
							<TripListItem trip={item} />
						</View>
					</SwipeToDelete>
				</Animated.View>
			)}
			ListEmptyComponent={
				<View style={styles.empty}>
					<MaterialCommunityIcons name="map-marker-path" size={48} color={colors.primary(0.6)} />
					<AppText style={styles.emptyTitle}>No trips yet</AppText>
					<AppText style={{ color: colors.text(0.6), textAlign: 'center' }}>
						Plan your first trip now
					</AppText>
					<Pressable
						onPress={() => router.push('/new-trip')}
						style={[styles.emptyButton, { backgroundColor: colors.primary() }]}
					>
						<AppText style={{ color: colors.surface(), fontWeight: '700' }}>Plan a trip</AppText>
					</Pressable>
				</View>
			}
		/>
	);
}

const styles = StyleSheet.create({
	row: {
		paddingHorizontal: 16,
	},
	empty: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		padding: 32,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	emptyButton: {
		marginTop: 12,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 10,
	},
});
