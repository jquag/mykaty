import { Coordinate } from '@/types/Trip';
import { PixelRatio, Platform } from 'react-native';
import type MapView from 'react-native-maps';
import type { EdgePadding, LatLng } from 'react-native-maps';

/**
 * Calculate distance in miles between two coordinates using the Haversine formula
 */
export function haversineMiles(start: Coordinate, end: Coordinate): number {
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
 * Zoom the map to fit the coordinates inside the given padding (in points)
 */
export function fitMapToCoordinates(
  map: MapView | null,
  coordinates: LatLng[],
  padding: EdgePadding
) {
  // Android expects edge padding in pixels, iOS in points
  const scale = Platform.OS === 'android' ? PixelRatio.get() : 1;
  map?.fitToCoordinates(coordinates, {
    edgePadding: {
      top: padding.top * scale,
      right: padding.right * scale,
      bottom: padding.bottom * scale,
      left: padding.left * scale,
    },
    animated: true,
  });
}
