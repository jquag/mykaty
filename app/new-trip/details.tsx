import TripForm, { TripFormValues } from "@/components/forms/TripForm";
import TripSummaryCard from "@/components/TripSummaryCard";
import HeaderButton from "@/components/ui/HeaderButton";
import { trailPoints } from "@/constants/trailPoints";
import { parseTripType } from "@/constants/tripTypes";
import { useTrips } from "@/contexts/TripsContext";
import type { Trip } from "@/types/Trip";
import { headerButtons } from "@/utils/header";
import { generateTripId } from "@/utils/storage";
import { isTrailIndex } from "@/utils/trail";
import { getRouteName, getTripIndices, todayLocal } from "@/utils/trip-util";
import { Redirect, Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView } from "react-native";

function toFormValues(trip: Trip): TripFormValues {
	return {
		title: trip.title ?? '',
		date: trip.date,
		time: trip.time,
		type: trip.type,
		isRoundTrip: trip.isRoundTrip,
		notes: trip.notes ?? '',
	};
}

/** With an `id`, edits that trip; `start` and `end` then override its saved route */
export default function TripDetails() {
	const router = useRouter();
	const navigation = useNavigation();
	const { trips, addTrip, updateTrip } = useTrips();
	const params = useLocalSearchParams<{ id?: string; start?: string; end?: string; type?: string }>();
	const trip = params.id ? trips.find(t => t.id === params.id) : undefined;
	const [saving, setSaving] = useState(false);
	const [values, setValues] = useState<TripFormValues>(() => trip ? toFormValues(trip) : {
		title: '',
		date: todayLocal(),
		type: parseTripType(params.type) ?? 'bike',
		isRoundTrip: false,
		notes: '',
	});

	if (params.id && !trip) {
		return <Redirect href="/trips" />;
	}

	const savedRoute = trip && getTripIndices(trip);
	const start = params.start ? Number(params.start) : savedRoute?.start ?? NaN;
	const end = params.end ? Number(params.end) : savedRoute?.end ?? NaN;
	if (!isTrailIndex(start) || !isTrailIndex(end) || start === end) {
		return <Redirect href="/new-trip" />;
	}

	// Editing, or opened straight from the map tab: there is no route picker underneath to go back to
	const isFirstScreen = navigation.getState()?.index === 0;

	const changeRoute = () => {
		router.push({ pathname: '/new-trip', params: { start, end, ...(params.id && { id: params.id }) } });
	};

	const handleSave = () => {
		setSaving(true);
		const fields = {
			title: values.title.trim() || undefined,
			date: values.date,
			time: values.time,
			start: { ...trailPoints[start] },
			end: { ...trailPoints[end] },
			type: values.type,
			isRoundTrip: values.isRoundTrip,
			notes: values.notes.trim() || undefined,
		};
		const save = trip
			? updateTrip({ ...trip, ...fields })
			: addTrip({ ...fields, id: generateTripId(), createdAt: new Date().toISOString() });
		save
			.then(() => (trip ? router.back() : router.dismissTo('/trips')))
			.catch((error) => {
				console.error('Error saving trip:', error);
				setSaving(false);
				Alert.alert('Could not save trip', 'Please try again.');
			});
	};

	return (
		<ScrollView
			contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}
			automaticallyAdjustKeyboardInsets
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="interactive"
		>
			<Stack.Screen
				options={{
					...(trip && { title: 'Edit Trip' }),
					headerBackVisible: !isFirstScreen,
					...headerButtons({
						left: isFirstScreen
							? <HeaderButton title="Cancel" onPress={() => router.back()} />
							: undefined,
						right: <HeaderButton title="Save" emphasized disabled={saving} onPress={handleSave} />,
					}),
				}}
			/>
			<TripSummaryCard
				startIndex={start}
				endIndex={end}
				isRoundTrip={values.isRoundTrip}
				onChangeRoute={isFirstScreen ? changeRoute : undefined}
			/>
			<TripForm
				values={values}
				onChange={(patch) => setValues(prev => ({ ...prev, ...patch }))}
				titlePlaceholder={getRouteName(start, end)}
			/>
		</ScrollView>
	);
}
