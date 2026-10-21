import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import AppText from "./ui/AppText";
import useColors from "@/hooks/use-colors";

const LABEL_HEIGHT = 20;
const LABEL_GAP = 2;
// Under every pin, so a label never takes a tap meant for a nearby pin
const LABEL_Z_INDEX = -1;
// Android draws a marker's view into a bitmap of the view's size, which would clip a label hanging outside it
const SEPARATE_LABEL = Platform.OS === 'android';

interface Props {
	coordinate: LatLng;
	// Side of the square around the pin that takes taps
	size: number;
	// Diameter of the drawn pin, so the label clears it
	pinSize: number;
	label?: string;
	labelWidth: number;
	zIndex?: number;
	tracksViewChanges?: boolean;
	onPress?: () => void;
	children: ReactNode;
}

/**
 * A pin centered on its coordinate, with an optional name below it. Only the square around the pin
 * takes taps; a label-sized view would cover nearby pins. On iOS the label hangs outside the view, where
 * taps pass through it, since Apple Maps ignores zIndex when picking which overlapping marker gets a tap.
 */
export default function LabeledMarker({ coordinate, size, pinSize, label, labelWidth, zIndex, tracksViewChanges, onPress, children }: Props) {
	const colors = useColors();
	const labelTop = pinSize / 2 + LABEL_GAP;
	const labelText = label !== undefined && (
		<AppText numberOfLines={1} style={{
			fontSize: 11,
			fontWeight: '600',
			paddingHorizontal: 4,
			paddingVertical: 2,
			borderRadius: 4,
			overflow: 'hidden',
			backgroundColor: colors.surface(.8),
		}}>
			{label}
		</AppText>
	);

	return (
		<>
			<Marker
				// Remount when the view's size changes; iOS doesn't resize an already-mounted marker
				key={size}
				coordinate={coordinate}
				anchor={{ x: 0.5, y: 0.5 }}
				zIndex={zIndex}
				tracksViewChanges={tracksViewChanges}
				onPress={onPress}
			>
				{/* collapsable={false}: the marker sizes itself from its first native child, so this view must not be flattened */}
				<View collapsable={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
					{children}
					{labelText && !SEPARATE_LABEL && (
						<View style={{
							position: 'absolute',
							top: size / 2 + labelTop,
							left: (size - labelWidth) / 2,
							width: labelWidth,
							height: LABEL_HEIGHT,
							alignItems: 'center',
						}}>
							{labelText}
						</View>
					)}
				</View>
			</Marker>
			{labelText && SEPARATE_LABEL && (
				<Marker
					key={labelTop}
					coordinate={coordinate}
					anchor={{ x: 0.5, y: 0 }}
					zIndex={LABEL_Z_INDEX}
					onPress={onPress}
				>
					<View collapsable={false} style={{ width: labelWidth, height: labelTop + LABEL_HEIGHT, paddingTop: labelTop, alignItems: 'center' }}>
						{labelText}
					</View>
				</Marker>
			)}
		</>
	);
}
