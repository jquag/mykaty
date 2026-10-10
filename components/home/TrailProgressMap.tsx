import AppText from "@/components/ui/AppText";
import { waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import type { CoverageSegment, TrailInterval } from "@/utils/progress";
import { fullOutlinePath, getOutlineHeight, getWaypointPositions, OUTLINE_WIDTH, outlinePath } from "@/utils/trail-outline";
import { StyleSheet, View } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";

interface Props {
	coverage?: CoverageSegment[];
	planned?: TrailInterval[];
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

export default function TrailProgressMap({ coverage = [], planned = [] }: Props) {
	const colors = useColors();
	const height = getOutlineHeight();
	const positions = getWaypointPositions();
	const heatColor = (count: number) => colors.heat[Math.min(count, colors.heat.length) - 1];
	const legendLevels = Math.min(Math.max(0, ...coverage.map(segment => segment.count)), colors.heat.length);

	return (
		<View style={styles.container}>
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
					{[...coverage].sort((a, b) => a.count - b.count).map(segment => (
						<Path
							key={`covered-${segment.start}`}
							d={outlinePath(segment.start, segment.end)}
							fill="none"
							stroke={heatColor(segment.count)}
							strokeWidth={4}
							strokeLinecap="round"
							strokeLinejoin="round"
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
			{legendLevels > 1 && (
				<View style={styles.legend}>
					<AppText style={[styles.legendText, { color: colors.text(0.6) }]}>Times covered</AppText>
					{colors.heat.slice(0, legendLevels).map((color, index) => (
						<View key={color} style={styles.legendItem}>
							<View style={[styles.swatch, { backgroundColor: color }]} />
							<AppText style={[styles.legendText, { color: colors.text(0.6) }]}>
								{index === colors.heat.length - 1 ? `${index + 1}+` : String(index + 1)}
							</AppText>
						</View>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: 6,
	},
	legend: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 10,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	swatch: {
		width: 14,
		height: 4,
		borderRadius: 2,
	},
	legendText: {
		fontSize: 12,
	},
});
