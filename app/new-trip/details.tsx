import TripForm, { TripFormValues } from "@/components/forms/TripForm";
import TripRouteCard from "@/components/trip/TripRouteCard";
import HeaderButton from "@/components/ui/HeaderButton";
import { trailPoints } from "@/constants/trailPoints";
import { parseTripType } from "@/constants/tripTypes";
import { useTrips } from "@/contexts/TripsContext";
import type { Coordinate, StopLeg, Trip, TripStop } from "@/types/Trip";
import { headerButtons } from "@/utils/header";
import { generateTripId } from "@/utils/storage";
import { addStop, isStopOnRoute, parseStop, removeStop } from "@/utils/stops";
import { isTrailIndex, trailIndexOf } from "@/utils/trail";
import { getRouteName, getTripIndices, todayLocal } from "@/utils/trip-util";
import { Redirect, Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

// A point that wasn't moved keeps its saved coordinate rather than being snapped to the trail index
function resolvePoint(index: number, saved?: Coordinate) {
	return saved && trailIndexOf(saved) === index ? saved : { ...trailPoints[index] };
}

function countStops(count: number) {
	return count === 1 ? '1 stop' : `${count} stops`;
}

/**
 * With an `id`, edits that trip; `start` and `end` then override its saved route.
 * `addStop` is a stop returned by the stop picker, added to the form once.
 */
export default function TripDetails() {
	const { trips, loading } = useTrips();
	const { id } = useLocalSearchParams<{ id?: string }>();

	if (!id) return <TripDetailsForm />;
	if (loading) return null;

	const trip = trips.find(t => t.id === id);
	if (!trip) return <Redirect href="/trips" />;
	return <TripDetailsForm trip={trip} />;
}

function TripDetailsForm({ trip }: { trip?: Trip }) {
	const router = useRouter();
	const navigation = useNavigation();
	const { addTrip, updateTrip } = useTrips();
	const params = useLocalSearchParams<{ id?: string; start?: string; end?: string; type?: string; addStop?: string }>();
	const [saving, setSaving] = useState(false);
	// Includes stops kept while they don't fit the route, in case the route or round trip changes back
	const [stops, setStops] = useState<TripStop[]>(() => trip?.stops ?? []);
	const [values, setValues] = useState<TripFormValues>(() => trip ? toFormValues(trip) : {
		title: '',
		date: todayLocal(),
		type: parseTripType(params.type) ?? 'bike',
		isRoundTrip: false,
		notes: '',
	});

	useFocusEffect(useCallback(() => {
		if (!params.addStop) return;
		router.setParams({ addStop: undefined });
		const stop = parseStop(params.addStop);
		if (stop) setStops(prev => addStop(prev, stop));
	}, [params.addStop, router]));

	const savedRoute = trip && getTripIndices(trip);
	const start = params.start ? Number(params.start) : savedRoute?.start ?? NaN;
	const end = params.end ? Number(params.end) : savedRoute?.end ?? NaN;
	if (!isTrailIndex(start) || !isTrailIndex(end) || start === end) {
		return <Redirect href="/new-trip" />;
	}

	// Editing, or opened straight from the map tab: there is no route picker underneath to go back to
	const isFirstScreen = navigation.getState()?.index === 0;

	const stopsOnRoute = stops.filter(stop => isStopOnRoute(stop, start, end));
	const plannedStops = stopsOnRoute.filter(stop => values.isRoundTrip || stop.leg === 'out');
	const offRouteCount = stops.length - stopsOnRoute.length;
	const returnStopCount = stopsOnRoute.length - plannedStops.length;
	const stopNotes = [
		...(offRouteCount > 0 ? [`${countStops(offRouteCount)} not along this route will be removed when you save.`] : []),
		...(returnStopCount > 0 ? [`Turn on Round trip to keep ${countStops(returnStopCount)} on the way back.`] : []),
	];

	const changeRoute = () => {
		router.push({ pathname: '/new-trip', params: { start, end, ...(params.id && { id: params.id }) } });
	};

	const openStopPicker = (leg: StopLeg) => {
		router.push({
			pathname: '/new-trip/add-stop',
			params: { start, end, leg, stops: JSON.stringify(plannedStops), ...(params.id && { id: params.id }) },
		});
	};

	const handleSave = () => {
		setSaving(true);
		const fields = {
			title: values.title.trim() || undefined,
			date: values.date,
			time: values.time,
			start: resolvePoint(start, trip?.start),
			end: resolvePoint(end, trip?.end),
			type: values.type,
			isRoundTrip: values.isRoundTrip,
			stops: plannedStops.length > 0 ? plannedStops : undefined,
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
			<TripRouteCard
				startIndex={start}
				endIndex={end}
				isRoundTrip={values.isRoundTrip}
				stops={plannedStops}
				notes={stopNotes}
				onAddStop={openStopPicker}
				onRemoveStop={(stop) => setStops(prev => removeStop(prev, stop))}
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
