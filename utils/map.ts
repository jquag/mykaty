import { Coordinate } from '@/types/Trip';
import { Linking, PixelRatio, Platform } from 'react-native';
import type MapView from 'react-native-maps';
import type { EdgePadding, LatLng, Region } from 'react-native-maps';

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

export function isInRegion(point: Coordinate, region: Region): boolean {
  return Math.abs(point.lat - region.latitude) < region.latitudeDelta / 2 &&
    Math.abs(point.lng - region.longitude) < region.longitudeDelta / 2;
}

export function openInMaps(point: Coordinate, label: string) {
  const { lat, lng } = point;
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps://?ll=${lat},${lng}&q=${encodedLabel}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  openUrl(url);
}

export function openUrl(url: string) {
  Linking.openURL(url).catch(error => console.warn(`Couldn't open ${url}:`, error));
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

/**
 * Decode a Google encoded polyline (precision 5)
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  const next = () => {
    let result = 0, shift = 0, byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lng += next();
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
