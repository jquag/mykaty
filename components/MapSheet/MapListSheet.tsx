import { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { POI_CATEGORIES } from '@/constants/pois';
import { usePois } from '@/contexts/PoisContext';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import { Place } from '@/types/Place';
import TrailheadListItem from './TrailheadListItem';
import PoiListItem from './PoiListItem';

export const BOTTOM_SHEET_COLLAPSED_HEIGHT = 78;

interface Props {
	places: Place[];
	emptyMessage: string;
	query: string;
	onQueryChange: (query: string) => void;
	onPlaceSelected: (place: Place) => void;
	partialOpenHeight: string | number;
}

const MapListSheet = forwardRef<BottomSheet, Props>(({
	places,
	emptyMessage,
	query,
	onQueryChange,
	onPlaceSelected,
	partialOpenHeight,
}, ref) => {
	const colors = useColors();
	const { enabledCategories, allCategoriesEnabled, toggleCategory, setCategoriesEnabled } = usePois();

	const snapPoints = useMemo(() => [BOTTOM_SHEET_COLLAPSED_HEIGHT, partialOpenHeight, '95%'], [partialOpenHeight]);
	const [currentSnapPoint, setCurrentSnapPoint] = useState<number>(0);

	const renderItem = useCallback(({ item }: { item: Place }) => (
		item.kind === 'poi'
			? <PoiListItem poi={item.poi} onPress={() => onPlaceSelected(item)} />
			: <TrailheadListItem waypoint={item.waypoint} onPress={() => onPlaceSelected(item)} />
	), [onPlaceSelected]);

	const renderEmptyMessage = () => (
		<View style={styles.emptyContainer}>
			<AppText style={[styles.emptyText, { color: colors.text(0.6) }]}>
				{emptyMessage}
			</AppText>
		</View>
	);

	return (
		<BottomSheet
			ref={ref}
			index={currentSnapPoint}
			snapPoints={snapPoints}
			onChange={setCurrentSnapPoint}
			backgroundStyle={{ backgroundColor: colors.surface(.9) }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
			enableDynamicSizing={false}
			keyboardBehavior="extend"
			android_keyboardInputMode="adjustResize"
		>
			<View style={styles.header}>
				<View style={[styles.searchField, { backgroundColor: colors.text(0.06) }]}>
					<Ionicons name="search" size={18} color={colors.text(0.5)} />
					<BottomSheetTextInput
						value={query}
						onChangeText={onQueryChange}
						placeholder="Search places & trailheads"
						placeholderTextColor={colors.text(0.4)}
						autoCorrect={false}
						returnKeyType="search"
						style={[styles.searchInput, { color: colors.text() }]}
					/>
					{query.length > 0 && (
						<Pressable onPress={() => onQueryChange('')} hitSlop={8} accessibilityLabel="Clear search">
							<Ionicons name="close-circle" size={18} color={colors.text(0.5)} />
						</Pressable>
					)}
				</View>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
					{POI_CATEGORIES.map(category => (
						<CategoryChip
							key={category.key}
							label={category.label}
							icon={category.icon}
							color={category.color}
							selected={enabledCategories.has(category.key)}
							onPress={() => toggleCategory(category.key)}
						/>
					))}
				</ScrollView>
				<Pressable
					onPress={() => setCategoriesEnabled(allCategoriesEnabled ? [] : POI_CATEGORIES.map(category => category.key))}
					hitSlop={8}
					accessibilityRole="button"
					style={styles.selectAll}
				>
					<AppText style={[styles.selectAllLabel, { color: colors.primary() }]}>
						{allCategoriesEnabled ? 'Unselect all' : 'Select all'}
					</AppText>
				</Pressable>
			</View>
			<View style={styles.listContainer}>
				{places.length > 0 ? (
					<BottomSheetFlatList
						data={places}
						keyExtractor={(place: Place) => place.kind === 'poi'
							? `poi-${place.poi.id}`
							: `trailhead-${place.waypoint.lat}-${place.waypoint.lng}`}
						renderItem={renderItem}
						contentContainerStyle={styles.listContent}
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
					/>
				) : (
					renderEmptyMessage()
				)}
			</View>
		</BottomSheet>
	);
});

MapListSheet.displayName = 'MapListSheet';

export default MapListSheet;

interface CategoryChipProps {
	label: string;
	icon: typeof POI_CATEGORIES[number]['icon'];
	color: string;
	selected: boolean;
	onPress: () => void;
}

function CategoryChip({ label, icon, color, selected, onPress }: CategoryChipProps) {
	const colors = useColors();
	const contentColor = selected ? colors.white() : colors.text();

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityState={{ selected }}
			style={[
				styles.chip,
				selected
					? { backgroundColor: color, borderColor: color }
					: { borderColor: colors.text(0.2) },
			]}
		>
			<MaterialCommunityIcons name={icon} size={14} color={selected ? contentColor : color} />
			<AppText style={[styles.chipLabel, { color: contentColor }]}>{label}</AppText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	header: {
		paddingTop: 4,
		gap: 10,
	},
	searchField: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginHorizontal: 16,
		paddingHorizontal: 12,
		height: 40,
		borderRadius: 10,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		paddingVertical: 0,
	},
	chips: {
		gap: 8,
		paddingHorizontal: 16,
	},
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
	},
	selectAll: {
		alignSelf: 'flex-start',
		marginHorizontal: 16,
	},
	selectAllLabel: {
		fontSize: 14,
		fontWeight: '600',
	},
	chipLabel: {
		fontSize: 14,
		fontWeight: '600',
	},
	listContainer: {
		flex: 1,
	},
	listContent: {
		marginTop: 8,
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
