import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import TrailheadListItem from './TrailheadListItem';

interface Props {
	waypoints: Waypoint[];
	onTrailheadPress: (waypoint: Waypoint) => void;
	partialOpenHeight: string | number;
}

export default function TrailheadBottomSheet({
	waypoints,
	onTrailheadPress,
	partialOpenHeight,
}: Props) {
	const colors = useColors();

	const snapPoints = useMemo(() => [35, partialOpenHeight, '95%'], [partialOpenHeight]);
	const [currentSnapPoint, setCurrentSnapPoint] = useState<number>(0);

	const renderItem = useCallback(({ item }: { item: Waypoint }) => (
		<TrailheadListItem
			waypoint={item}
			onPress={() => {
				setCurrentSnapPoint(1); //reset to the partially open state
				onTrailheadPress(item);
			}}
    />
	), [onTrailheadPress]);

	const renderEmptyMessage = () => (
		<View style={styles.emptyContainer}>
			<AppText style={[styles.emptyText, { color: colors.text(0.6) }]}>
				Zoom in to see trailheads
			</AppText>
		</View>
	);

	return (
		<BottomSheet
			index={currentSnapPoint}
			snapPoints={snapPoints}
			onChange={(i) => setCurrentSnapPoint(i)}
			backgroundStyle={{ backgroundColor: colors.surface(.9) }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
		>
			{waypoints.length > 0 ? (
				<BottomSheetFlatList
					data={waypoints}
					keyExtractor={(item: Waypoint) => `${item.lat}-${item.lng}`}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
				/>
			) : (
				renderEmptyMessage()
			)}
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	header: {
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	headerText: {
		fontSize: 18,
		fontWeight: '700',
	},
	listContent: {
		paddingHorizontal: 16,
		paddingBottom: 100,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		paddingTop: 40,
	},
	emptyText: {
		fontSize: 16,
	},
});
