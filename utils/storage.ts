import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '@/types/Trip';

const TRIP_PREFIX = 'trip_';

export function generateTripId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
}

export async function saveTrip(trip: Trip): Promise<void> {
  await AsyncStorage.setItem(`${TRIP_PREFIX}${trip.id}`, JSON.stringify(trip));
}

export async function deleteTrip(id: string): Promise<void> {
  await AsyncStorage.removeItem(`${TRIP_PREFIX}${id}`);
}

export async function getAllTrips(): Promise<Trip[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const tripKeys = allKeys.filter(key => key.startsWith(TRIP_PREFIX));
  const tripPairs = await AsyncStorage.multiGet(tripKeys);

  const trips: Trip[] = [];
  for (const [key, value] of tripPairs) {
    if (!value) continue;
    try {
      trips.push(JSON.parse(value));
    } catch (parseError) {
      console.error(`Error parsing trip ${key}:`, parseError);
    }
  }
  return trips;
}
