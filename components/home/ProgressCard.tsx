import TrailProgressMap from "@/components/home/TrailProgressMap";
import SegmentedControl from "@/components/forms/SegmentedControl";
import AppText from "@/components/ui/AppText";
import { getTripTypeOption, TRIP_TYPES } from "@/constants/tripTypes";
import { waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import type { Trip } from "@/types/Trip";
import { addedMiles, formatPercent, summarizeProgress, type TripFilter, type TripSuggestion } from "@/utils/progress";
import { formatDate, getTripSummary } from "@/utils/trip-util";
import { getTotalTrailMiles } from "@/utils/trail";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
	completed: Trip[];
	upcoming: Trip[];
}

const FILTER_OPTIONS: { value: TripFilter; label: string }[] = [
	{ value: 'all', label: 'All' },
	...TRIP_TYPES.map(({ value, label }) => ({ value, label })),
];

const SUGGESTION_TITLES: Record<TripSuggestion['kind'], string> = {
	gap: 'Close a gap',
	east: 'Keep going east',
	west: 'Keep going west',
};

export default function ProgressCard({ completed, upcoming }: Props) {
	const colors = useColors();
	const router = useRouter();
	const [filter, setFilter] = useState<TripFilter>('all');

	// Filtering only makes sense once completed trips span more than one type
	const showFilter = new Set(completed.map(trip => trip.type)).size > 1;
	const activeFilter = showFilter ? filter : 'all';
	const progress = summarizeProgress(completed, upcoming, activeFilter);
	const totalMiles = Math.round(getTotalTrailMiles());

	const filterType = activeFilter === 'all' ? undefined : activeFilter;
	const planTrip = (route?: { start: number; end: number }) => {
		router.push({ pathname: '/new-trip', params: { ...route, ...(filterType && { type: filterType }) } });
	};

	const map = <TrailProgressMap coverage={progress.coverage} planned={progress.planned} />;

	let body;
	if (completed.length === 0 && upcoming.length === 0) {
		body = (
			<>
				{map}
				<AppText style={styles.message}>
					{`${totalMiles} miles and ${waypoints.length} trailheads. Each trip you take fills in its stretch.`}
				</AppText>
				<Pressable onPress={() => planTrip()} style={[styles.primaryButton, { backgroundColor: colors.primary() }]}>
					<AppText style={{ color: colors.surface(), fontWeight: '700' }}>Plan your first trip</AppText>
				</Pressable>
			</>
		);
	} else if (completed.length === 0) {
		const next = upcoming[0];
		const added = addedMiles(next, []);
		body = (
			<>
				{map}
				<View style={styles.row}>
					<MaterialCommunityIcons name="calendar" size={16} color={colors.text(0.6)} />
					<AppText style={[styles.caption, { color: colors.text(0.6) }]}>
						{`${getTripSummary(next).title} on ${formatDate(next.date)} adds ${added.toFixed(1)} mi (${formatPercent(added / getTotalTrailMiles())})`}
					</AppText>
				</View>
			</>
		);
	} else if (progress.tripCount === 0 && filterType) {
		const { noun, pluralNoun } = getTripTypeOption(filterType);
		body = (
			<>
				{map}
				<View style={styles.linkRow}>
					<AppText style={{ color: colors.text(0.6) }}>{`No ${pluralNoun} yet`}</AppText>
					<Pressable onPress={() => planTrip()} hitSlop={8} style={styles.row}>
						<AppText style={[styles.link, { color: colors.primary() }]}>{`Plan a ${noun}`}</AppText>
						<MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary()} />
					</Pressable>
				</View>
			</>
		);
	} else {
		const { suggestion } = progress;
		body = (
			<>
				<View style={styles.percentRow}>
					<AppText style={styles.percent}>{formatPercent(progress.fraction)}</AppText>
					<AppText style={{ color: colors.text(0.6) }}>of the trail</AppText>
				</View>
				{map}
				<View style={styles.stats}>
					<Stat label="Trailheads" value={`${progress.reachedCount}/${waypoints.length}`} />
					<Stat label="Trips" value={String(progress.tripCount)} />
					<Stat label="Longest" value={`${progress.longestMiles.toFixed(1)} mi`} />
				</View>
				{suggestion ? (
					<Pressable
						onPress={() => planTrip({ start: suggestion.start, end: suggestion.end })}
						style={[styles.linkRow, styles.suggestion, { borderTopColor: colors.text(0.1) }]}
					>
						<View style={{ flexShrink: 1 }}>
							<AppText style={[styles.caption, { color: colors.text(0.6) }]}>{SUGGESTION_TITLES[suggestion.kind]}</AppText>
							<AppText style={styles.suggestionRoute}>{`${suggestion.routeName} · ${suggestion.miles.toFixed(1)} mi`}</AppText>
						</View>
						<View style={styles.row}>
							<AppText style={[styles.link, { color: colors.primary() }]}>Plan</AppText>
							<MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary()} />
						</View>
					</Pressable>
				) : progress.fraction >= 0.999 && (
					<AppText style={[styles.caption, { color: colors.primary() }]}>{"You've covered the whole trail"}</AppText>
				)}
			</>
		);
	}

	return (
		<View style={[styles.card, { borderColor: colors.text(0.1) }]}>
			<View style={styles.header}>
				<AppText style={styles.title}>Your progress</AppText>
				<AppText style={[styles.caption, { color: colors.text(0.6) }]}>
					{`${progress.coveredMiles.toFixed(1)} of ${totalMiles} mi`}
				</AppText>
			</View>
			{showFilter && <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />}
			{body}
		</View>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	const colors = useColors();
	return (
		<View style={[styles.stat, { backgroundColor: colors.text(0.05) }]}>
			<AppText style={[styles.caption, { color: colors.text(0.6) }]}>{label}</AppText>
			<AppText style={styles.statValue}>{value}</AppText>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
		gap: 12,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	caption: {
		fontSize: 14,
	},
	message: {
		fontSize: 15,
		lineHeight: 21,
	},
	percentRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: 8,
	},
	percent: {
		fontSize: 32,
		fontWeight: 'bold',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		flexShrink: 1,
	},
	linkRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	link: {
		fontSize: 15,
		fontWeight: '700',
	},
	stats: {
		flexDirection: 'row',
		gap: 8,
	},
	stat: {
		flex: 1,
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 10,
		gap: 2,
	},
	statValue: {
		fontSize: 17,
		fontWeight: '700',
	},
	suggestion: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 12,
	},
	suggestionRoute: {
		fontSize: 16,
		fontWeight: '600',
	},
	primaryButton: {
		alignItems: 'center',
		paddingVertical: 12,
		borderRadius: 10,
	},
});
