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

/**
 * Calculate raw distance between two coordinates (no rounding)
 */
function calculateDistanceRaw(start: Coordinate, end: Coordinate): number {
  const R = 3959; // Earth's radius in miles
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const deltaLat = (end.lat - start.lat) * Math.PI / 180;
  const deltaLon = (end.lng - start.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate cumulative distance along trail points between two indices
 * @param trailPoints Array of trail coordinates
 * @param startIndex Starting index in the array
 * @param endIndex Ending index in the array
 * @returns Total distance in miles, rounded to 2 decimal places
 */
export function calculateTrailDistance(
  trailPoints: Coordinate[],
  startIndex: number,
  endIndex: number
): number {
  if (startIndex === endIndex) return 0;

  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);

  let totalDistance = 0;
  for (let i = start; i < end; i++) {
    totalDistance += calculateDistanceRaw(trailPoints[i], trailPoints[i + 1]);
  }

  return Math.round(totalDistance * 100) / 100;
}