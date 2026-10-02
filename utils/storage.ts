import AsyncStorage from '@react-native-async-storage/async-storage';
import { PoiCategory, PoiFile } from '@/constants/pois';
import { Trip } from '@/types/Trip';

const TRIP_PREFIX = 'trip_';
const POIS_FILE_KEY = 'pois_file';
const POIS_SHA_KEY = 'pois_sha';
const POIS_CHECKED_AT_KEY = 'pois_checked_at';
const POI_CATEGORIES_KEY = 'poi_categories';

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

export async function getCachedPois(): Promise<{ file: PoiFile; sha: string } | null> {
  const [[, fileJson], [, sha]] = await AsyncStorage.multiGet([POIS_FILE_KEY, POIS_SHA_KEY]);
  if (!fileJson || !sha) return null;
  return { file: JSON.parse(fileJson), sha };
}

export async function saveCachedPois(fileJson: string, sha: string): Promise<void> {
  await AsyncStorage.multiSet([[POIS_FILE_KEY, fileJson], [POIS_SHA_KEY, sha]]);
}

export async function getPoisCheckedAt(): Promise<number | null> {
  const checkedAt = await AsyncStorage.getItem(POIS_CHECKED_AT_KEY);
  return checkedAt ? Number(checkedAt) : null;
}

export async function savePoisCheckedAt(time: number): Promise<void> {
  await AsyncStorage.setItem(POIS_CHECKED_AT_KEY, String(time));
}

export async function getPoiCategories(): Promise<PoiCategory[]> {
  const categoriesJson = await AsyncStorage.getItem(POI_CATEGORIES_KEY);
  return categoriesJson ? JSON.parse(categoriesJson) : [];
}

export async function savePoiCategories(categories: PoiCategory[]): Promise<void> {
  await AsyncStorage.setItem(POI_CATEGORIES_KEY, JSON.stringify(categories));
}
