import { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import TrailheadListItem from './TrailheadListItem';

interface Props {
	waypoints: Waypoint[];
	onPoiSelected: (waypoint: Waypoint) => void;
	partialOpenHeight: string | number;
}

export default function TrailheadBottomSheet({
	waypoints,
	onPoiSelected,
	partialOpenHeight,
}: Props) {
	const colors = useColors();

	const snapPoints = useMemo(() => [45, partialOpenHeight, '95%'], [partialOpenHeight]);
	const [currentSnapPoint, setCurrentSnapPoint] = useState<number>(0);
	const listRef = useRef<any>(null);

	const renderItem = useCallback(({ item }: { item: Waypoint }) => (
		<TrailheadListItem
			waypoint={item}
			onPress={() => {
				onPoiSelected(item);
			}}
		/>
	), [onPoiSelected]);

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
			onChange={setCurrentSnapPoint}
			backgroundStyle={{ backgroundColor: colors.surface(.9) }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
			enableDynamicSizing={false}
		>
			<View style={styles.listContainer}>
				{waypoints.length > 0 ? (
					<BottomSheetFlatList
						ref={listRef}
						data={waypoints}
						keyExtractor={(item: Waypoint) => `${item.lat}-${item.lng}`}
						renderItem={renderItem}
						contentContainerStyle={styles.listContent}
					/>
				) : (
					renderEmptyMessage()
				)}
			</View>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	listContainer: {
		flex: 1,
	},
	listContent: {
		marginTop: 16,
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
