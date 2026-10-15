import useColors from "@/hooks/use-colors";
import { getCategoryConfig } from "@/utils/pois";
import type { TripItinerary } from "@/utils/stops";
import { getSegmentOutline, Point } from "@/utils/trail-outline";
import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

const ENDPOINT_RADIUS = 8;
const STOP_RADIUS = 7;
const FONT_SIZE = 9;
const BADGE_GAP = 1;

interface Props {
	startIndex: number;
	endIndex: number;
	itinerary: TripItinerary;
}

interface Badge {
	key: string;
	trailIndex: number;
	label: string;
	radius: number;
	color: string;
	fill: string;
	stroke: string;
	textColor: string;
}

/** The trip's stretch of trail with its start, end and numbered stops where they leave the trail */
export default function TripOutline({ startIndex, endIndex, itinerary }: Props) {
	const colors = useColors();
	const outline = useMemo(() => getSegmentOutline(startIndex, endIndex), [startIndex, endIndex]);

	const endpoint = (key: string, trailIndex: number, label: string): Badge => ({
		key,
		trailIndex,
		label,
		radius: ENDPOINT_RADIUS,
		color: colors.primary(),
		fill: colors.primary(),
		stroke: colors.surface(),
		textColor: colors.border(),
	});

	const badges: Badge[] = [endpoint('start', startIndex, 'A'), endpoint('end', endIndex, 'B')];
	for (const entry of [...itinerary.out, ...(itinerary.back ?? [])]) {
		if (!entry.stop) continue;
		const color = getCategoryConfig(entry.stop.category).color;
		const hollow = entry.stop.leg === 'back';
		badges.push({
			key: `${entry.stop.leg}-${entry.stop.poiId}`,
			trailIndex: entry.trailIndex,
			label: String(entry.number),
			radius: STOP_RADIUS,
			color,
			fill: hollow ? colors.surface() : color,
			stroke: hollow ? color : colors.surface(),
			textColor: hollow ? color : colors.white(),
		});
	}

	const placed = placeBadges(badges, outline.project, outline.height);

	return (
		<View style={{ width: '100%', aspectRatio: outline.width / outline.height }}>
			<Svg width="100%" height="100%" viewBox={`0 0 ${outline.width} ${outline.height}`}>
				<Path
					d={outline.path}
					fill="none"
					stroke={colors.primary(0.6)}
					strokeWidth={4}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{placed.map(({ badge, anchor, y }) => (
					<G key={badge.key}>
						{y !== anchor.y && (
							<Line x1={anchor.x} y1={anchor.y} x2={anchor.x} y2={y} stroke={badge.color} strokeWidth={1.5} />
						)}
						<Circle cx={anchor.x} cy={y} r={badge.radius} fill={badge.fill} stroke={badge.stroke} strokeWidth={1.5} />
						<SvgText
							x={anchor.x}
							y={y + FONT_SIZE * 0.35}
							textAnchor="middle"
							fontSize={FONT_SIZE}
							fontWeight="bold"
							fill={badge.textColor}
						>
							{badge.label}
						</SvgText>
					</G>
				))}
			</Svg>
		</View>
	);
}

/**
 * Positions each badge on the trail where it leaves it, or stacked just above or below when that spot is taken,
 * so stops in the same town as an end or each other stay readable
 */
function placeBadges(badges: Badge[], project: (index: number) => Point, height: number) {
	const placed: { badge: Badge; anchor: Point; y: number }[] = [];
	for (const badge of badges) {
		const anchor = project(badge.trailIndex);
		const step = badge.radius * 2 + BADGE_GAP;
		const overlaps = (y: number) => placed.some(other =>
			Math.hypot(other.anchor.x - anchor.x, other.y - y) < other.badge.radius + badge.radius + BADGE_GAP);
		const fits = (y: number) => y >= badge.radius && y <= height - badge.radius;
		let y = anchor.y;
		for (let n = 1; overlaps(y) && n <= badges.length * 2; n++) {
			const offset = Math.ceil(n / 2) * step * (n % 2 ? -1 : 1);
			if (fits(anchor.y + offset)) y = anchor.y + offset;
		}
		placed.push({ badge, anchor, y });
	}
	return placed;
}
