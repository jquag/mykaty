import { waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import type { TrailInterval } from "@/utils/progress";
import { fullOutlinePath, getOutlineHeight, getWaypointPositions, OUTLINE_WIDTH, outlinePath } from "@/utils/trail-outline";
import { View } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

interface Props {
	covered?: TrailInterval[];
	planned?: TrailInterval[];
	/** One flag per waypoint, in waypoint order */
	reached?: boolean[];
}

interface Label {
	waypoint: string;
	text: string;
	dx: number;
	dy: number;
	anchor: 'start' | 'middle' | 'end';
}

const LABELS: Label[] = [
	{ waypoint: 'Machens', text: 'Machens', dx: 0, dy: -7, anchor: 'end' },
	{ waypoint: 'Augusta', text: 'Augusta', dx: 0, dy: 13, anchor: 'middle' },
	{ waypoint: 'North Jefferson', text: 'Jeff City', dx: 0, dy: 13, anchor: 'middle' },
	{ waypoint: 'Boonville', text: 'Boonville', dx: 0, dy: -7, anchor: 'middle' },
	{ waypoint: 'Clinton', text: 'Clinton', dx: 6, dy: 4, anchor: 'start' },
];

export default function TrailProgressMap({ covered = [], planned = [], reached = [] }: Props) {
	const colors = useColors();
	const height = getOutlineHeight();
	const positions = getWaypointPositions();

	return (
		<View style={{ width: '100%', aspectRatio: OUTLINE_WIDTH / height }}>
			<Svg width="100%" height="100%" viewBox={`0 0 ${OUTLINE_WIDTH} ${height}`}>
				<Path
					d={fullOutlinePath()}
					fill="none"
					stroke={colors.text(0.15)}
					strokeWidth={4}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{planned.map(interval => (
					<Path
						key={`planned-${interval.start}`}
						d={outlinePath(interval.start, interval.end)}
						fill="none"
						stroke={colors.primary()}
						strokeWidth={4}
						strokeDasharray="4 3"
						strokeLinejoin="round"
					/>
				))}
				{covered.map(interval => (
					<Path
						key={`covered-${interval.start}`}
						d={outlinePath(interval.start, interval.end)}
						fill="none"
						stroke={colors.primary()}
						strokeWidth={4}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				))}
				{positions.map((position, index) => reached[index] ? (
					<Circle
						key={waypoints[index].name}
						cx={position.x}
						cy={position.y}
						r={2.6}
						fill={colors.primary()}
						stroke={colors.surface()}
						strokeWidth={1.2}
					/>
				) : (
					<Circle
						key={waypoints[index].name}
						cx={position.x}
						cy={position.y}
						r={1.8}
						fill={colors.surface()}
						stroke={colors.text(0.35)}
						strokeWidth={1}
					/>
				))}
				{LABELS.map(label => {
					const position = positions[waypoints.findIndex(wp => wp.name === label.waypoint)];
					if (!position) return null;
					return (
						<SvgText
							key={label.text}
							x={position.x + label.dx}
							y={position.y + label.dy}
							textAnchor={label.anchor}
							fontSize={10}
							fill={colors.text(0.6)}
						>
							{label.text}
						</SvgText>
					);
				})}
			</Svg>
		</View>
	);
}
