import { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import TrailheadListItem from './TrailheadListItem';

interface Props {
  waypoints: Waypoint[];
  onTrailheadPress: (waypoint: Waypoint) => void;
}

export default function TrailheadBottomSheet({
  waypoints,
  onTrailheadPress
}: Props) {
  const colors = useColors();

  const snapPoints = useMemo(() => ['12%', '40%', '85%'], []);

  const renderItem = useCallback(({ item }: { item: Waypoint }) => (
    <TrailheadListItem
      waypoint={item}
      onPress={() => onTrailheadPress(item)}
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
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.surface() }}
      handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
    >
      <View style={styles.header}>
        <AppText style={[styles.headerText, { color: colors.primary() }]}>
          {waypoints.length > 0
            ? `${waypoints.length} Trailhead${waypoints.length !== 1 ? 's' : ''}`
            : 'Trailheads'
          }
        </AppText>
      </View>

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
