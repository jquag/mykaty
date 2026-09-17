import MeasureMarker from "@/components/MeasureMarker";
import useColors from "@/hooks/use-colors";
import type { SegmentEnd, TrailSegment } from "@/hooks/use-trail-segment";
import { getSegmentCoordinates, trailCoordinates } from "@/utils/trail";
import { useMemo } from "react";
import { Polyline } from "react-native-maps";

interface Props {
	segment: TrailSegment;
	showLabels: boolean;
}

const ENDS: { which: SegmentEnd; label: string }[] = [
	{ which: 'start', label: 'A' },
	{ which: 'end', label: 'B' },
];

export default function TrailSegmentLayer({ segment, showLabels }: Props) {
	const colors = useColors();
	const { start, end, markerKeys, dragTo, dropAt } = segment;

	// A new array identity here rebuilds the whole native polyline, and drags emit continuously
	const segmentCoordinates = useMemo(
		() => (start !== null && end !== null ? getSegmentCoordinates(start, end) : null),
		[start, end]
	);

	return (
		<>
			{segmentCoordinates && (
				<Polyline
					coordinates={segmentCoordinates}
					strokeColor={colors.primary()}
					strokeWidth={8}
					zIndex={1}
				/>
			)}

			{ENDS.map(({ which, label }) => {
				const index = segment[which];
				if (index === null) return null;
				return (
					<MeasureMarker
						key={which}
						label={label}
						markerKey={`${which}-${markerKeys[which]}-${showLabels}`}
						coordinate={trailCoordinates[index]}
						showLabels={showLabels}
						onDrag={(e) => {
							const { latitude, longitude } = e.nativeEvent.coordinate;
							dragTo(which, latitude, longitude);
						}}
						onDragEnd={(e) => {
							const { latitude, longitude } = e.nativeEvent.coordinate;
							dropAt(which, latitude, longitude);
						}}
					/>
				);
			})}
		</>
	);
}
