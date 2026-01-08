import { Coordinate } from '@/types/Trip';

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param start Starting coordinate
 * @param end Ending coordinate
 * @param unit Unit of measurement ('miles' or 'km')
 * @returns Distance rounded to 1 decimal place
 */
export function calculateDistance(
  start: Coordinate,
  end: Coordinate,
  unit: 'miles' | 'km' = 'miles'
): number {
  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const deltaLat = (end.lat - start.lat) * Math.PI / 180;
  const deltaLon = (end.lng - start.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}