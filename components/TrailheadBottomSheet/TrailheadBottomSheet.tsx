import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
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

interface Props {
	waypoints: Waypoint[];
	onPoiSelected: (waypoint: Waypoint) => void;
	onClearPoiSelection: () => void;
	partialOpenHeight: string | number;
}

export default function TrailheadBottomSheet({
	waypoints,
	onPoiSelected,
	onClearPoiSelection,
	partialOpenHeight,
}: Props) {
	const colors = useColors();
	const { width } = useWindowDimensions();

	const snapPoints = useMemo(() => [55, partialOpenHeight, '95%'], [partialOpenHeight]);
	const [currentSnapPoint, setCurrentSnapPoint] = useState<number>(0);
	const [detailItem, setDetailItem] = useState<Waypoint | null>(null);

	const translateX = useSharedValue(width);

	useEffect(() => {
		if (detailItem) {
			translateX.value = withTiming(0, { duration: 250 });
		} else {
			translateX.value = width;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detailItem]);

	const detailAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const listAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: -width + translateX.value }],
	}));

	const handleCloseDetail = () => {
		translateX.value = withTiming(width, { duration: 250 });
		onClearPoiSelection();
		setTimeout(() => {
			setDetailItem(null);
			if (currentSnapPoint === 2) setCurrentSnapPoint(1);
		}, 250);
	};

	const renderItem = useCallback(({ item }: { item: Waypoint }) => (
		<TrailheadListItem
			waypoint={item}
			onPress={() => {
				setCurrentSnapPoint(1); //reset to the partially open state
				setDetailItem(item);
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
						data={waypoints}
						keyExtractor={(item: Waypoint) => `${item.lat}-${item.lng}`}
						renderItem={renderItem}
						contentContainerStyle={styles.listContent}
					/>
				) : (
					renderEmptyMessage()
				)}
			</Animated.View>
			{detailItem && (
				<Animated.View style={[styles.detailOverlay, { backgroundColor: colors.surface(0) }, detailAnimatedStyle]}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
						<AppText>{detailItem.name}</AppText>
						<Pressable onPress={handleCloseDetail}>
							<AppText>X</AppText>
						</Pressable>
					</View>
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
