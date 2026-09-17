import { Trip } from "@/types/Trip";
import { deleteTrip as deleteStoredTrip, getAllTrips, saveTrip } from "@/utils/storage";
import { compareTrips } from "@/utils/trip-util";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface TripsContextType {
	trips: Trip[];
	loading: boolean;
	loadFailed: boolean;
	reload: () => Promise<void>;
	addTrip: (trip: Trip) => Promise<void>;
	updateTrip: (trip: Trip) => Promise<void>;
	deleteTrip: (id: string) => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function TripsProvider({ children }: { children: ReactNode }) {
	const [trips, setTrips] = useState<Trip[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);

	// A failed read must stay distinguishable from an empty store, or it reads as data loss
	const load = useCallback(() => {
		return getAllTrips()
			.then(loaded => {
				setTrips(loaded.sort(compareTrips));
				setLoadFailed(false);
			})
			.catch(error => {
				console.error('Error loading trips:', error);
				setLoadFailed(true);
			})
			.finally(() => setLoading(false));
	}, []);

	const reload = useCallback(() => {
		setLoading(true);
		return load();
	}, [load]);

	useEffect(() => {
		load();
	}, [load]);

	const addTrip = useCallback(async (trip: Trip) => {
		await saveTrip(trip);
		setTrips(prev => [...prev, trip].sort(compareTrips));
	}, []);

	const updateTrip = useCallback(async (trip: Trip) => {
		await saveTrip(trip);
		setTrips(prev => prev.map(t => (t.id === trip.id ? trip : t)).sort(compareTrips));
	}, []);

	const deleteTrip = useCallback(async (id: string) => {
		await deleteStoredTrip(id);
		setTrips(prev => prev.filter(t => t.id !== id));
	}, []);

	const value = useMemo(
		() => ({ trips, loading, loadFailed, reload, addTrip, updateTrip, deleteTrip }),
		[trips, loading, loadFailed, reload, addTrip, updateTrip, deleteTrip]
	);

	return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips() {
	const context = useContext(TripsContext);
	if (context === undefined) {
		throw new Error('useTrips must be used within a TripsProvider');
	}
	return context;
}
