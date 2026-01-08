import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '@/types/Trip';
import { getStartDateTime } from './trip-util';

const TRIP_PREFIX = 'trip_';

export function generateTripId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
}

export async function saveTrip(trip: Trip): Promise<void> {
  try {
    const key = `${TRIP_PREFIX}${trip.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(trip));
  } catch (error) {
    console.error('Error saving trip:', error);
    throw error;
  }
}

export async function getTrip(id: string): Promise<Trip | null> {
  try {
    const key = `${TRIP_PREFIX}${id}`;
    const tripJson = await AsyncStorage.getItem(key);
    if (tripJson) {
      return JSON.parse(tripJson);
    }
    return null;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
}

export async function getAllTrips(): Promise<Trip[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tripKeys = allKeys.filter(key => key.startsWith(TRIP_PREFIX));
    
    if (tripKeys.length === 0) {
      return [];
    }
    
    const tripPairs = await AsyncStorage.multiGet(tripKeys);
    const trips: Trip[] = [];
    
    for (const [key, value] of tripPairs) {
      if (value) {
        try {
          trips.push(JSON.parse(value));
        } catch (parseError) {
          console.error(`Error parsing trip ${key}:`, parseError);
        }
      }
    }
    
    // Sort by startDate+startTime (nulls last), then by createdAt for ties
    return trips.sort((a, b) => {
      const aDateTime = getStartDateTime(a);
      const bDateTime = getStartDateTime(b);
      
      // Handle nulls - put them at the end
      if (!aDateTime && !bDateTime) {
        // Both null, sort by createdAt (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (!aDateTime) return 1; // a is null, put it after b
      if (!bDateTime) return -1; // b is null, put it after a
      
      // Both have dates, compare them (newest first)
      const dateDiff = bDateTime.getTime() - aDateTime.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // Dates are the same, sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error getting all trips:', error);
    throw error;
  }
}

export async function deleteTrip(id: string): Promise<void> {
  try {
    const key = `${TRIP_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
}

export async function updateTrip(trip: Trip): Promise<void> {
  return saveTrip(trip);
}
