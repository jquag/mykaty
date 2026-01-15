import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import TrailheadListItem from './TrailheadListItem';
import TrailheadDetail from './TrailheadDetail';

interface Props {
	waypoints: Waypoint[];
	selectedPoi: Waypoint | null;
	onPoiSelected: (waypoint: Waypoint) => void;
	onClearPoiSelection: () => void;
	partialOpenHeight: string | number;
}

export default function TrailheadBottomSheet({
	waypoints,
	selectedPoi,
	onPoiSelected,
	onClearPoiSelection,
	partialOpenHeight,
}: Props) {
	const colors = useColors();
	const { width } = useWindowDimensions();

	const snapPoints = useMemo(() => [55, partialOpenHeight, '95%'], [partialOpenHeight]);
	const [currentSnapPoint, setCurrentSnapPoint] = useState<number>(0);
	const listRef = useRef<any>(null);

	const translateX = useSharedValue(width);

	useEffect(() => {
		if (selectedPoi) {
			translateX.value = withTiming(0, { duration: 250 });
			setCurrentSnapPoint(1);
		} else {
			translateX.value = width;
			listRef.current?.scrollToOffset({ offset: 0, animated: false });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedPoi]);

	const detailAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const listAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: -width + translateX.value }],
	}));

	const handleCloseDetail = () => {
		translateX.value = withTiming(width, { duration: 250 });
		setTimeout(() => {
			onClearPoiSelection();
			if (currentSnapPoint === 2) setCurrentSnapPoint(1);
		}, 250);
	};

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
			onChange={(i) => setCurrentSnapPoint(i)}
			backgroundStyle={{ backgroundColor: colors.surface(.9) }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
			enableDynamicSizing={false}
		>
			<Animated.View style={[styles.listContainer, listAnimatedStyle]}>
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
			</Animated.View>
			{selectedPoi && (
				<Animated.View style={[styles.detailOverlay, { backgroundColor: colors.surface() }, detailAnimatedStyle]}>
					<TrailheadDetail
						waypoint={selectedPoi}
						isExpanded={currentSnapPoint > 0}
						onClose={handleCloseDetail}
					/>
				</Animated.View>
			)}
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	listContainer: {
		flex: 1,
	},
	detailOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	header: {
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	headerText: {
		fontSize: 18,
		fontWeight: '700',
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
