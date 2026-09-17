import type { TripType } from "@/types/Trip";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

interface TripTypeOption {
	value: TripType;
	label: string;
	icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export const TRIP_TYPES: TripTypeOption[] = [
	{ value: 'bike', label: 'Bike', icon: 'bike' },
	{ value: 'run', label: 'Run', icon: 'run' },
	{ value: 'walk', label: 'Walk', icon: 'walk' },
];
