import AsyncStorage from '@react-native-async-storage/async-storage';
import { PoiCategory, PoiFile, PoiRouteFile } from '@/constants/pois';
import { FunFactFile } from '@/types/FunFact';
import { Trip } from '@/types/Trip';

const TRIP_PREFIX = 'trip_';
const POIS_FILE_KEY = 'pois_file';
const POIS_SHA_KEY = 'pois_sha';
const POI_ROUTES_FILE_KEY = 'poi_routes_file';
const POI_ROUTES_SHA_KEY = 'poi_routes_sha';
const POIS_CHECKED_AT_KEY = 'pois_checked_at';
const POI_CATEGORIES_KEY = 'poi_categories';
const FUN_FACTS_FILE_KEY = 'fun_facts_file';
const FUN_FACTS_SHA_KEY = 'fun_facts_sha';
const FUN_FACTS_CHECKED_AT_KEY = 'fun_facts_checked_at';

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

export async function getCachedPoiRoutes(): Promise<{ file: PoiRouteFile; sha: string } | null> {
  const [[, fileJson], [, sha]] = await AsyncStorage.multiGet([POI_ROUTES_FILE_KEY, POI_ROUTES_SHA_KEY]);
  if (!fileJson || !sha) return null;
  return { file: JSON.parse(fileJson), sha };
}

export async function saveCachedPoiRoutes(fileJson: string, sha: string): Promise<void> {
  await AsyncStorage.multiSet([[POI_ROUTES_FILE_KEY, fileJson], [POI_ROUTES_SHA_KEY, sha]]);
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

export async function getCachedFunFacts(): Promise<{ file: FunFactFile; sha: string } | null> {
  const [[, fileJson], [, sha]] = await AsyncStorage.multiGet([FUN_FACTS_FILE_KEY, FUN_FACTS_SHA_KEY]);
  if (!fileJson || !sha) return null;
  return { file: JSON.parse(fileJson), sha };
}

export async function saveCachedFunFacts(fileJson: string, sha: string): Promise<void> {
  await AsyncStorage.multiSet([[FUN_FACTS_FILE_KEY, fileJson], [FUN_FACTS_SHA_KEY, sha]]);
}

export async function getFunFactsCheckedAt(): Promise<number | null> {
  const checkedAt = await AsyncStorage.getItem(FUN_FACTS_CHECKED_AT_KEY);
  return checkedAt ? Number(checkedAt) : null;
}

export async function saveFunFactsCheckedAt(time: number): Promise<void> {
  await AsyncStorage.setItem(FUN_FACTS_CHECKED_AT_KEY, String(time));
}
