import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

// Mirrors the output of scripts/pois; see scripts/pois/README.md
export type PoiCategory = 'food' | 'lodging' | 'grocery' | 'bike';

export interface Poi {
	id: string;
	name: string;
	category: PoiCategory;
	subcategory: string;
	lat: number;
	lng: number;
	trailIndex: number;
	trailMile: number;
	milesFromTrail: number;
	nearestTrailhead: string;
	phone?: string;
	website?: string;
	address?: string;
	acrossRiver?: boolean;
}

export interface PoiFile {
	schemaVersion: number;
	generatedAt: string;
	overtureRelease: string;
	attribution: string;
	pois: Poi[];
}

export interface PoiManifest {
	schemaVersion: number;
	generatedAt: string;
	sha256: string;
	count: number;
	file: string;
}

export const POI_BASE_URL = 'https://d1z2mt0madk0y1.cloudfront.net/pois';
export const POI_SCHEMA_VERSION = 1;
export const POI_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface PoiCategoryConfig {
	key: PoiCategory;
	label: string;
	icon: IconName;
	color: string;
}

export const POI_CATEGORIES: PoiCategoryConfig[] = [
	{ key: 'food', label: 'Food', icon: 'silverware-fork-knife', color: '#1A9C8C' },
	{ key: 'lodging', label: 'Lodging', icon: 'bed', color: '#4A7BD0' },
	{ key: 'grocery', label: 'Grocery', icon: 'cart', color: '#8E5CC4' },
	{ key: 'bike', label: 'Bike', icon: 'bicycle', color: '#E0892B' },
];

// Stands in for categories published after this app version; it has no filter chip
export const OTHER_POI_CATEGORY: Omit<PoiCategoryConfig, 'key'> = {
	label: 'Other',
	icon: 'map-marker',
	color: '#6B7280',
};

export const SUBCATEGORY_LABELS: Record<PoiCategory, Record<string, string>> = {
	food: {
		restaurant: 'Restaurant',
		fast_food: 'Fast food',
		bar: 'Bar',
		brewery: 'Brewery',
		winery: 'Winery',
		distillery: 'Distillery',
		cafe: 'Cafe',
		bakery: 'Bakery',
		dessert: 'Dessert',
	},
	lodging: {
		hotel: 'Hotel',
		bed_and_breakfast: 'B&B',
		rental: 'Rental',
		camping: 'Camping',
		other: 'Lodging',
	},
	grocery: {
		grocery: 'Grocery',
		convenience: 'Convenience store',
		pharmacy: 'Pharmacy',
	},
	bike: {
		shop: 'Bike shop',
		rental: 'Bike rental',
	},
};
