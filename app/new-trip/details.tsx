import TripForm, { TripFormValues } from "@/components/forms/TripForm";
import TripSummaryCard from "@/components/TripSummaryCard";
import HeaderButton from "@/components/ui/HeaderButton";
import { trailPoints } from "@/constants/trailPoints";
import { useTrips } from "@/contexts/TripsContext";
import type { Trip } from "@/types/Trip";
import { headerButtons } from "@/utils/header";
import { generateTripId } from "@/utils/storage";
import { isTrailIndex } from "@/utils/trail";
import { getRouteName, todayLocal } from "@/utils/trip-util";
import { Redirect, Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView } from "react-native";

export default function TripDetails() {
	const router = useRouter();
	const navigation = useNavigation();
	const { addTrip } = useTrips();
	const params = useLocalSearchParams<{ start?: string; end?: string }>();
	const [saving, setSaving] = useState(false);
	const [values, setValues] = useState<TripFormValues>(() => ({
		title: '',
		date: todayLocal(),
		type: 'bike',
		isRoundTrip: false,
		notes: '',
	}));

	const start = params.start ? Number(params.start) : NaN;
	const end = params.end ? Number(params.end) : NaN;
	if (!isTrailIndex(start) || !isTrailIndex(end) || start === end) {
		return <Redirect href="/new-trip" />;
	}

	// Opened straight from the map tab, there is no route picker underneath to go back to
	const isFirstScreen = navigation.getState()?.index === 0;

	const handleSave = () => {
		setSaving(true);
		const trip: Trip = {
			id: generateTripId(),
			title: values.title.trim() || undefined,
			date: values.date,
			time: values.time,
			start: { ...trailPoints[start] },
			end: { ...trailPoints[end] },
			type: values.type,
			isRoundTrip: values.isRoundTrip,
			notes: values.notes.trim() || undefined,
			createdAt: new Date().toISOString(),
		};
		addTrip(trip)
			.then(() => router.dismissTo('/trips'))
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
					headerBackVisible: !isFirstScreen,
					...headerButtons({
						left: isFirstScreen
							? <HeaderButton title="Cancel" onPress={() => router.back()} />
							: undefined,
						right: <HeaderButton title="Save" emphasized disabled={saving} onPress={handleSave} />,
					}),
				}}
			/>
			<TripSummaryCard startIndex={start} endIndex={end} isRoundTrip={values.isRoundTrip} />
			<TripForm
				values={values}
				onChange={(patch) => setValues(prev => ({ ...prev, ...patch }))}
				titlePlaceholder={getRouteName(start, end)}
			/>
		</ScrollView>
	);
}
