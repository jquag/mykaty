import TripOutline from "@/components/trip/TripOutline";
import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import type { StopLeg, TripStop } from "@/types/Trip";
import { formatMilesFromTrail, getCategoryConfig, isOnTrail } from "@/utils/pois";
import { buildTripItinerary, ItineraryEntry } from "@/utils/stops";
import { describeTrailPoint } from "@/utils/trail";
import { getRouteMiles } from "@/utils/trip-util";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

const BADGE_SIZE = 26;

interface Props {
	startIndex: number;
	endIndex: number;
	isRoundTrip: boolean;
	/** Only the stops that will be saved with this route */
	stops: TripStop[];
	/** Explains stops that won't be saved */
	notes: string[];
	onAddStop: (leg: StopLeg) => void;
	onRemoveStop: (stop: TripStop) => void;
	onChangeRoute?: () => void;
}

export default function TripRouteCard({
	startIndex,
	endIndex,
	isRoundTrip,
	stops,
	notes,
	onAddStop,
	onRemoveStop,
	onChangeRoute,
}: Props) {
	const colors = useColors();
	const itinerary = buildTripItinerary(startIndex, endIndex, isRoundTrip, stops);
	const trailMiles = getRouteMiles(startIndex, endIndex, isRoundTrip);

	return (
		<View style={[styles.card, { borderColor: colors.text(0.12) }]}>
			<View style={styles.header}>
				<MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.primary()} />
				<AppText>{trailMiles.toFixed(1)} mi{isRoundTrip ? ' round trip' : ''}</AppText>
				{onChangeRoute && (
					<Pressable onPress={onChangeRoute} hitSlop={8} accessibilityRole="button" style={styles.changeRoute}>
						<AppText style={[styles.link, { color: colors.primary() }]}>Change route</AppText>
					</Pressable>
				)}
			</View>
			<TripOutline startIndex={startIndex} endIndex={endIndex} itinerary={itinerary} />

			{itinerary.back && <SectionTitle title="Way out" />}
			<LegList entries={itinerary.out} endLabels={['A', 'B']} onRemoveStop={onRemoveStop} />
			<AddStopButton onPress={() => onAddStop('out')} />

			{itinerary.back && (
				<>
					<SectionTitle title="Way back" />
					<LegList entries={itinerary.back} endLabels={['B', 'A']} onRemoveStop={onRemoveStop} />
					<AddStopButton onPress={() => onAddStop('back')} />
				</>
			)}

			{stops.some(stop => !isOnTrail(stop.milesFromTrail)) && (
				<AppText style={[styles.footer, { color: colors.text(0.7) }]}>
					{itinerary.totalMiles.toFixed(1)} mi with stops · {itinerary.offTrailMiles.toFixed(1)} mi off trail
				</AppText>
			)}
			{notes.map(note => (
				<AppText key={note} style={[styles.footer, { color: colors.accent() }]}>{note}</AppText>
			))}
		</View>
	);
}

function SectionTitle({ title }: { title: string }) {
	const colors = useColors();
	return <AppText style={[styles.sectionTitle, { color: colors.text(0.6) }]}>{title}</AppText>;
}

interface LegListProps {
	entries: ItineraryEntry[];
	endLabels: [string, string];
	onRemoveStop: (stop: TripStop) => void;
}

function LegList({ entries, endLabels, onRemoveStop }: LegListProps) {
	const colors = useColors();

	return (
		<View>
			{entries.map((entry, index) => {
				const { stop } = entry;
				const key = stop ? `${stop.leg}-${stop.poiId}` : `end-${index}`;
				return (
					<View key={key}>
						{index > 0 && (
							<View style={styles.row}>
								<View style={styles.badgeColumn}>
									<View style={[styles.legLine, { backgroundColor: colors.text(0.2) }]} />
								</View>
								<AppText style={[styles.legMiles, { color: colors.text(0.6) }]}>
									{entry.legMiles.toFixed(1)} mi
								</AppText>
							</View>
						)}
						<View style={styles.row}>
							{stop ? (
								<>
									<StopBadge stop={stop} number={entry.number} />
									<View style={styles.stopText}>
										<AppText style={styles.placeName} numberOfLines={1}>{stop.name}</AppText>
										<AppText style={[styles.stopDetail, { color: colors.text(0.6) }]}>
											{formatMilesFromTrail(stop.milesFromTrail)}
										</AppText>
									</View>
									<Pressable
										onPress={() => onRemoveStop(stop)}
										hitSlop={8}
										accessibilityRole="button"
										accessibilityLabel={`Remove ${stop.name}`}
									>
										<Ionicons name="close-circle" size={22} color={colors.text(0.4)} />
									</Pressable>
								</>
							) : (
								<>
									<View style={[styles.badge, { backgroundColor: colors.primary() }]}>
										<AppText style={[styles.badgeLabel, { color: colors.border() }]}>
											{endLabels[index === 0 ? 0 : 1]}
										</AppText>
									</View>
									<AppText style={styles.placeName} numberOfLines={1}>
										{describeTrailPoint(entry.trailIndex)}
									</AppText>
								</>
							)}
						</View>
					</View>
				);
			})}
		</View>
	);
}

function StopBadge({ stop, number }: { stop: TripStop; number?: number }) {
	const colors = useColors();
	const color = getCategoryConfig(stop.category).color;
	const hollow = stop.leg === 'back';

	return (
		<View style={[
			styles.badge,
			hollow
				? { borderWidth: 2, borderColor: color, backgroundColor: colors.surface() }
				: { backgroundColor: color },
		]}>
			<AppText style={[styles.badgeLabel, { color: hollow ? color : colors.white() }]}>{number}</AppText>
		</View>
	);
}

function AddStopButton({ onPress }: { onPress: () => void }) {
	const colors = useColors();

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			style={({ pressed }) => [
				styles.addButton,
				{ borderColor: colors.primary(0.4), backgroundColor: pressed ? colors.primary(0.1) : undefined },
			]}
		>
			<Ionicons name="add-circle-outline" size={18} color={colors.primary()} />
			<AppText style={[styles.addLabel, { color: colors.primary() }]}>Add stop</AppText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
		gap: 10,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	changeRoute: {
		marginLeft: 'auto',
	},
	link: {
		fontSize: 15,
		fontWeight: '700',
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		marginTop: 4,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	badgeColumn: {
		width: BADGE_SIZE,
		alignItems: 'center',
	},
	legLine: {
		width: 2,
		height: 22,
		borderRadius: 1,
	},
	legMiles: {
		fontSize: 14,
	},
	badge: {
		width: BADGE_SIZE,
		height: BADGE_SIZE,
		borderRadius: BADGE_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	badgeLabel: {
		fontSize: 13,
		fontWeight: '700',
	},
	stopText: {
		flex: 1,
		paddingVertical: 2,
	},
	placeName: {
		flexShrink: 1,
		fontWeight: '600',
	},
	stopDetail: {
		fontSize: 13,
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	addLabel: {
		fontWeight: '700',
	},
	footer: {
		fontSize: 14,
	},
});
