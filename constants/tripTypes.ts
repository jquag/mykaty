import type { TripType } from "@/types/Trip";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

interface TripTypeOption {
	value: TripType;
	label: string;
	icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
	noun: string;
	pluralNoun: string;
}

export const TRIP_TYPES: TripTypeOption[] = [
	{ value: 'bike', label: 'Bike', icon: 'bike', noun: 'ride', pluralNoun: 'rides' },
	{ value: 'run', label: 'Run', icon: 'run', noun: 'run', pluralNoun: 'runs' },
	{ value: 'walk', label: 'Walk', icon: 'walk', noun: 'walk', pluralNoun: 'walks' },
];

export function getTripTypeOption(type: TripType) {
	return TRIP_TYPES.find(option => option.value === type) ?? TRIP_TYPES[0];
}

export function parseTripType(value?: string): TripType | undefined {
	return TRIP_TYPES.find(option => option.value === value)?.value;
}
