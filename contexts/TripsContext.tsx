import { Trip } from "@/types/Trip";
import { deleteTrip as deleteStoredTrip, getAllTrips, saveTrip } from "@/utils/storage";
import { compareTrips } from "@/utils/trip-util";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface TripsContextType {
	trips: Trip[];
	loading: boolean;
	addTrip: (trip: Trip) => Promise<void>;
	updateTrip: (trip: Trip) => Promise<void>;
	deleteTrip: (id: string) => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function TripsProvider({ children }: { children: ReactNode }) {
	const [trips, setTrips] = useState<Trip[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getAllTrips()
			.then(loaded => setTrips(loaded.sort(compareTrips)))
			.catch(error => console.error('Error loading trips:', error))
			.finally(() => setLoading(false));
	}, []);

	const addTrip = async (trip: Trip) => {
		await saveTrip(trip);
		setTrips(prev => [...prev, trip].sort(compareTrips));
	};

	const updateTrip = async (trip: Trip) => {
		await saveTrip(trip);
		setTrips(prev => prev.map(t => (t.id === trip.id ? trip : t)).sort(compareTrips));
	};

	const deleteTrip = async (id: string) => {
		await deleteStoredTrip(id);
		setTrips(prev => prev.filter(t => t.id !== id));
	};

	return (
		<TripsContext.Provider value={{ trips, loading, addTrip, updateTrip, deleteTrip }}>
			{children}
		</TripsContext.Provider>
	);
}

export function useTrips() {
	const context = useContext(TripsContext);
	if (context === undefined) {
		throw new Error('useTrips must be used within a TripsProvider');
	}
	return context;
}
