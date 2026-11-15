import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { TrailheadServices } from '@/constants/waypoints';

export type ServiceKey = keyof TrailheadServices;

export type ServiceIconName =
	| { set: 'ionicons'; name: ComponentProps<typeof Ionicons>['name'] }
	| { set: 'mci'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

export interface ServiceConfig {
	key: ServiceKey;
	label: string;
	icon: ServiceIconName;
}

export const SERVICES: ServiceConfig[] = [
	{ key: 'parking', label: 'Parking', icon: { set: 'mci', name: 'parking' } },
	{ key: 'water', label: 'Water', icon: { set: 'ionicons', name: 'water' } },
	{ key: 'restroom', label: 'Restroom', icon: { set: 'mci', name: 'human-male-female' } },
	{ key: 'camping', label: 'Camping', icon: { set: 'ionicons', name: 'bonfire' } },
	{ key: 'foodGrocery', label: 'Grocery', icon: { set: 'ionicons', name: 'cart' } },
	{ key: 'restaurant', label: 'Restaurant', icon: { set: 'mci', name: 'silverware-fork-knife' } },
	{ key: 'lodging', label: 'Lodging', icon: { set: 'ionicons', name: 'bed' } },
	{ key: 'bikeShop', label: 'Bike Shop', icon: { set: 'ionicons', name: 'bicycle' } },
	{ key: 'bikeRental', label: 'Bike Rental', icon: { set: 'mci', name: 'bike-fast' } },
	{ key: 'bikeService', label: 'Bike Service', icon: { set: 'mci', name: 'wrench' } },
	{ key: 'bikeWorkStation', label: 'Work Station', icon: { set: 'mci', name: 'tools' } },
	{ key: 'shuttleService', label: 'Shuttle', icon: { set: 'ionicons', name: 'car' } },
	{ key: 'phone', label: 'Phone', icon: { set: 'ionicons', name: 'call' } },
];

export const SERVICE_ICONS = Object.fromEntries(
	SERVICES.map(({ key, icon }) => [key, icon])
) as Record<ServiceKey, ServiceIconName>;

export function hasService(services: TrailheadServices | undefined, key: ServiceKey) {
	return services?.[key] != null;
}
